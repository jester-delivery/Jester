const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../utils/prisma');
const authenticateToken = require('../middleware/authenticateToken');
const requireAdmin = require('../middleware/requireAdmin');
const { validate, createMvpOrderSchema, updateOrderStatusSchema } = require('../utils/validation');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const { emitOrderStatus } = require('../utils/orderEvents');
const { isValidSulinaAddress } = require('../data/sulinaAddresses');
const { PRODUCT_DELIVERY_FEE, PACKAGE_DELIVERY_FEE } = require('../config/delivery');

const router = express.Router();

const cartOrderCreateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Prea multe comenzi. Încearcă din nou în câteva minute.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /cart-orders
 * Returnează toate comenzile din cart_orders cu items (cart_order_items).
 * Ordine: createdAt desc (latest first).
 */
router.get('/', async (req, res) => {
  try {
    const orders = await prisma.cartOrder.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching cart orders:', error);
    res.status(500).json({
      error: 'Eroare la obținerea comenzilor',
      code: 'FETCH_CART_ORDERS_ERROR',
    });
  }
});

/**
 * POST /cart-orders
 * Creează CartOrder + CartOrderItems. Necesită auth; userId din JWT.
 */
// UUID v4 simplu (hex 8-4-4-4-12)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.post('/', cartOrderCreateLimiter, authenticateToken, validate(createMvpOrderSchema), async (req, res) => {
  try {
    const userId = req.userId;
    const rawKey = req.headers['idempotency-key'];
    const idempotencyKey = (rawKey != null && String(rawKey).trim() !== '') ? String(rawKey).trim().slice(0, 128) : null;
    const body = req.body || {};
    const { orderType, items, total, paymentMethod, deliveryAddress, phone, name, notes } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Comanda trebuie să conțină cel puțin un produs', code: 'VALIDATION_ERROR' });
    }
    if (!userId) {
      return res.status(401).json({ error: 'Autentificare necesară', code: 'USER_ID_MISSING' });
    }
    const isUuid = typeof userId === 'string' && UUID_REGEX.test(userId);
    if (!isUuid) {
      return res.status(400).json({ error: 'ID utilizator invalid', code: 'INVALID_USER_ID' });
    }

    if (idempotencyKey && userId) {
      const existing = await prisma.cartOrder.findFirst({
        where: { userId, idempotencyKey, deletedAt: null },
        select: { id: true },
      });
      if (existing) {
        return res.status(201).json({ success: true, orderId: existing.id });
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit', code: 'USER_NOT_FOUND' });
    }

    const type = orderType === 'package_delivery' ? 'package_delivery' : 'product_order';
    const quantities = items.map((it) => Math.max(1, Math.min(99, Math.floor(Number(it.quantity) || 1))));
    const names = items.map((it) => String(it.name ?? '').trim().slice(0, 200));
    const productIds = items.map((it) => it.productId || null);

    let backendTotal;
    const itemsData = [];

    if (type === 'package_delivery') {
      backendTotal = PACKAGE_DELIVERY_FEE;
      itemsData.push({
        name: names[0] || 'Livrare pachet',
        price: PACKAGE_DELIVERY_FEE,
        quantity: quantities[0] || 1,
      });
    } else {
      let subtotal = 0;
      for (let i = 0; i < items.length; i++) {
        let product = null;
        if (productIds[i] && UUID_REGEX.test(productIds[i])) {
          product = await prisma.product.findFirst({
            where: { id: productIds[i], isActive: true, available: true },
            select: { id: true, name: true, price: true },
          });
        }
        if (!product) {
          product = await prisma.product.findFirst({
            where: { name: names[i], isActive: true, available: true },
            select: { id: true, name: true, price: true },
          });
        }
        if (!product) {
          return res.status(400).json({
            error: `Produs indisponibil sau inactiv: ${names[i] || '(fără nume)'}`,
            code: 'PRODUCT_UNAVAILABLE',
          });
        }
        const rawPrice = product.price != null ? product.price : 0;
        const price = Math.max(0, Number(rawPrice) || parseFloat(String(rawPrice)) || 0);
        const qty = quantities[i];
        subtotal += price * qty;
        itemsData.push({ name: product.name, price, quantity: qty });
      }
      backendTotal = Math.round((subtotal + PRODUCT_DELIVERY_FEE) * 100) / 100;
    }

    const clientTotal = Number(total);
    if (Math.abs(clientTotal - backendTotal) > 0.01) {
      return res.status(409).json({ code: 'TOTAL_MISMATCH' });
    }

    const deliveryAddr = deliveryAddress ? String(deliveryAddress).trim() : '';
    if (!isValidSulinaAddress(deliveryAddr)) {
      return res.status(400).json({
        error: 'Momentan livrăm doar în Sulina. Alege o adresă din listă.',
        code: 'DELIVERY_ADDRESS_NOT_IN_SULINA',
      });
    }
    const pm = paymentMethod === 'cash' || paymentMethod === 'CASH_ON_DELIVERY'
      ? 'CASH_ON_DELIVERY'
      : (paymentMethod === 'CARD' ? 'CARD' : 'CASH_ON_DELIVERY');

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.cartOrder.create({
        data: {
          userId: userId || null,
          idempotencyKey: idempotencyKey || undefined,
          orderType: type,
          status: 'PENDING',
          total: backendTotal,
          paymentMethod: pm,
          deliveryAddress: deliveryAddr || null,
          phone: phone ? String(phone).trim() : null,
          name: name ? String(name).trim() : null,
          notes: notes ? String(notes).trim().slice(0, 1000) : null,
          items: { create: itemsData },
        },
        include: { items: true },
      });
      return newOrder;
    });

    try {
      await sendOrderConfirmationEmail({
        to: user.email,
        name: user.name || name || 'Client',
        order: {
          id: order.id,
          createdAt: order.createdAt,
          deliveryAddress: order.deliveryAddress,
          phone: order.phone,
          paymentMethod: order.paymentMethod,
          items: order.items,
          total: order.total,
          estimatedDeliveryMinutes: order.estimatedDeliveryMinutes ?? undefined,
        },
      });
    } catch (_) {
      // [email] failed already logged in emailService; 201 still returned
    }

    res.status(201).json({ success: true, orderId: order.id });
  } catch (error) {
    if (error.code === 'P2002') {
      // Unique violation (userId, idempotencyKey) – race: another request created same key
      const existing = await prisma.cartOrder.findFirst({
        where: { userId, idempotencyKey: idempotencyKey || undefined, deletedAt: null },
        select: { id: true },
      }).catch(() => null);
      if (existing) {
        return res.status(201).json({ success: true, orderId: existing.id });
      }
    }
    console.error('[POST /cart-orders] Prisma/DB Error:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    const code = error.code || 'CREATE_ORDER_ERROR';
    const rawMessage = error.meta?.message ?? error.message;
    const message = typeof rawMessage === 'string' ? rawMessage : 'Eroare la crearea comenzii';
    if (!res.headersSent) {
      res.status(500).json({ error: message, code });
    }
  }
});

// --- PATCH /cart-orders/:id/status (admin) – același flow ca PATCH /orders/:id/status
const STATUS_VALUES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'ON_THE_WAY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'CANCELED'];
const VALID_CANCEL_FROM = ['PENDING', 'CONFIRMED'];
const VALID_NEXT = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'CANCELED'],
  CONFIRMED: ['PREPARING', 'ON_THE_WAY', 'OUT_FOR_DELIVERY', 'CANCELLED', 'CANCELED'],
  PREPARING: ['ON_THE_WAY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'CANCELED'],
  ON_THE_WAY: ['DELIVERED', 'CANCELLED', 'CANCELED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED', 'CANCELED'],
  DELIVERED: [],
  CANCELLED: [],
  CANCELED: [],
};

router.patch('/:id/status', authenticateToken, requireAdmin, validate(updateOrderStatusSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, estimatedDeliveryMinutes, internalNotes } = req.body;

    if (status != null && !STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        error: 'Status invalid',
        code: 'INVALID_STATUS',
      });
    }

    const order = await prisma.cartOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({
        error: 'Comandă negăsită',
        code: 'ORDER_NOT_FOUND',
      });
    }

    const isCancel = status && (status === 'CANCELLED' || status === 'CANCELED');
    if (isCancel && !VALID_CANCEL_FROM.includes(order.status)) {
      return res.status(400).json({
        error: 'Anularea este permisă doar din PENDING sau CONFIRMED',
        code: 'INVALID_STATUS_TRANSITION',
      });
    }

    const allowed = VALID_NEXT[order.status] || [];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({
        error: `Tranziție invalidă: ${order.status} → ${status}`,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }

    const data = {};
    if (status != null) data.status = status;
    if (estimatedDeliveryMinutes !== undefined) data.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
    if (internalNotes !== undefined) data.internalNotes = internalNotes;

    const updatedOrder = await prisma.cartOrder.update({
      where: { id },
      data,
      include: { items: true },
    });

    if (status != null) {
      const { logOrderStatusChange } = require('../utils/orderStatusLog');
      await logOrderStatusChange(id, order.status, data.status, req.userId || null);
      emitOrderStatus(updatedOrder);
    }

    res.json({ order: updatedOrder });
  } catch (error) {
    console.error('Error updating cart order status:', error);
    res.status(500).json({
      error: 'Eroare la actualizarea statusului',
      code: 'UPDATE_ORDER_STATUS_ERROR',
    });
  }
});

module.exports = router;
