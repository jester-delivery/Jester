const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../utils/prisma');
const authenticateToken = require('../middleware/authenticateToken');
const requireAdmin = require('../middleware/requireAdmin');
const { validate, createMvpOrderSchema, updateOrderStatusSchema } = require('../utils/validation');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const { emitOrderStatus } = require('../utils/orderEvents');

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
  const userId = req.userId;
  const { items, total, paymentMethod, deliveryAddress, phone, name, notes } = req.body;

  try {
    if (!userId) {
      return res.status(401).json({ error: 'Autentificare necesară', code: 'USER_ID_MISSING' });
    }
    const isUuid = typeof userId === 'string' && UUID_REGEX.test(userId);
    if (!isUuid) {
      return res.status(400).json({ error: 'ID utilizator invalid', code: 'INVALID_USER_ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit', code: 'USER_NOT_FOUND' });
    }

    const totalNum = Number(total);
    const pm = paymentMethod === 'cash' || paymentMethod === 'CASH_ON_DELIVERY'
      ? 'CASH_ON_DELIVERY'
      : (paymentMethod === 'CARD' ? 'CARD' : 'CASH_ON_DELIVERY');
    const itemsData = items.map((item) => ({
      name: String(item.name ?? '').trim().slice(0, 200),
      price: Number(item.price),
      quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1))),
    }));

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.cartOrder.create({
        data: {
          userId: userId || null,
          status: 'PENDING',
          total: totalNum,
          paymentMethod: pm,
          deliveryAddress: deliveryAddress ? String(deliveryAddress).trim() : null,
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
    console.error('[POST /cart-orders] Prisma/DB Error:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    const code = error.code || 'CREATE_ORDER_ERROR';
    const message = error.meta?.message || error.message || 'Eroare la crearea comenzii';
    res.status(500).json({
      error: message,
      code,
    });
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
