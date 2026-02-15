const express = require('express');
const prisma = require('../utils/prisma');
const authenticateToken = require('../middleware/authenticateToken');
const { validate, createMvpOrderSchema } = require('../utils/validation');
const { sendOrderConfirmationEmail } = require('../services/emailService');

const router = express.Router();

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

router.post('/', authenticateToken, validate(createMvpOrderSchema), async (req, res) => {
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
      name: String(item.name),
      price: Number(item.price),
      quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
    }));

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.cartOrder.create({
        data: {
          userId,
          status: 'PENDING',
          total: totalNum,
          paymentMethod: pm,
          deliveryAddress: deliveryAddress ? String(deliveryAddress) : null,
          phone: phone ? String(phone) : null,
          name: name ? String(name) : null,
          notes: notes ? String(notes) : null,
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
        },
      });
    } catch (emailErr) {
      console.error('[cart-orders] Order confirmation email failed:', emailErr.message);
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

module.exports = router;
