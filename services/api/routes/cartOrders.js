const express = require('express');
const prisma = require('../utils/prisma');
const authenticateToken = require('../middleware/authenticateToken');
const { validate, createMvpOrderSchema } = require('../utils/validation');

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
router.post('/', authenticateToken, validate(createMvpOrderSchema), async (req, res) => {
  try {
    const userId = req.userId;
    const { items, total, paymentMethod, deliveryAddress, phone, name, notes } = req.body;
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

    res.status(201).json({ success: true, orderId: order.id });
  } catch (error) {
    console.error('Error creating cart order:', error);
    const code = error.code || 'CREATE_ORDER_ERROR';
    const message = error.meta?.message || error.message || 'Eroare la crearea comenzii';
    res.status(500).json({
      error: message,
      code,
    });
  }
});

module.exports = router;
