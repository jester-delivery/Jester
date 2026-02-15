const express = require('express');
const prisma = require('../utils/prisma');
const authenticateToken = require('../middleware/authenticateToken');
const requireAdmin = require('../middleware/requireAdmin');
const { validate, updateOrderStatusSchema } = require('../utils/validation');
const { orderEvents, emitOrderStatus } = require('../utils/orderEvents');

const router = express.Router();

const STATUS_VALUES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'ON_THE_WAY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'CANCELED'];

/**
 * GET /orders/my
 * Comenzile user-ului logat (ordonate desc după createdAt)
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const orders = await prisma.cartOrder.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching my orders:', error);
    res.status(500).json({
      error: 'Eroare la obținerea comenzilor',
      code: 'FETCH_ORDERS_ERROR',
    });
  }
});

/**
 * GET /orders/stream/:orderId
 * SSE stream pentru update-uri status în timp real.
 * Clientul primește event: status_changed când admin schimbă statusul.
 */
router.get('/stream/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const order = await prisma.cartOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.userId !== userId) {
      return res.status(403).json({ error: 'Acces interzis', code: 'FORBIDDEN' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const handler = (payload) => {
      if (payload.orderId === orderId) {
        res.write(`event: status_changed\n`);
        res.write(`data: ${JSON.stringify({ status: payload.status, order: payload.order })}\n\n`);
        res.flush?.();
      }
    };

    orderEvents.on('order:status', handler);

    req.on('close', () => {
      orderEvents.off('order:status', handler);
    });
  } catch (error) {
    console.error('Error setting up SSE stream:', error);
    res.status(500).json({ error: 'Eroare la deschiderea stream-ului', code: 'SSE_ERROR' });
  }
});

/**
 * GET /orders/:id
 * Comanda + items, doar dacă order.userId === req.userId
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

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

    if (order.userId !== userId) {
      return res.status(403).json({
        error: 'Nu ai permisiunea să accesezi această comandă',
        code: 'FORBIDDEN',
      });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      error: 'Eroare la obținerea comenzii',
      code: 'FETCH_ORDER_ERROR',
    });
  }
});

/**
 * PATCH /orders/:id/status
 * Actualizează statusul comenzii (doar admin - ADMIN_EMAILS în .env)
 */
const VALID_CANCEL_FROM = ['PENDING', 'CONFIRMED'];
const VALID_NEXT = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'CANCELED'],
  CONFIRMED: ['PREPARING', 'ON_THE_WAY', 'OUT_FOR_DELIVERY', 'CANCELLED', 'CANCELED'],
  PREPARING: ['ON_THE_WAY', 'OUT_FOR_DELIVERY', 'DELIVERED'],
  ON_THE_WAY: ['DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
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
    console.error('Error updating order status:', error);
    res.status(500).json({
      error: 'Eroare la actualizarea statusului',
      code: 'UPDATE_ORDER_ERROR',
    });
  }
});

module.exports = router;
