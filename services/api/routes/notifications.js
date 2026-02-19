const express = require('express');
const prisma = require('../utils/prisma');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

/**
 * GET /notifications
 * Comenzile user-ului pentru lista de notificări (exclude comenzi „dismissed”).
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const dismissed = await prisma.notificationDismissal.findMany({
      where: { userId },
      select: { orderId: true },
    });
    const dismissedIds = dismissed.map((d) => d.orderId);

    const orders = await prisma.cartOrder.findMany({
      where: {
        userId,
        deletedAt: null,
        id: dismissedIds.length ? { notIn: dismissedIds } : undefined,
      },
      include: {
        items: true,
        courierRejections: { orderBy: { rejectedAt: 'desc' }, take: 1, select: { rejectedAt: true, reason: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const ordersWithRefused = orders.map((o) => {
      const { courierRejections, ...rest } = o;
      const last = courierRejections?.[0];
      const lastCourierRefusedAt = last?.rejectedAt?.toISOString?.() ?? null;
      const lastCourierRefusedReason = last?.reason ?? null;
      return { ...rest, lastCourierRefusedAt, lastCourierRefusedReason };
    });

    res.json({ orders: ordersWithRefused });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      error: 'Eroare la obținerea notificărilor',
      code: 'FETCH_NOTIFICATIONS_ERROR',
    });
  }
});

/**
 * POST /notifications/dismiss
 * Body: { orderId }. Ascunde comanda din lista de notificări (soft delete UX).
 */
router.post('/dismiss', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { orderId } = req.body;
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({
        error: 'orderId lipsă sau invalid',
        code: 'INVALID_ORDER_ID',
      });
    }

    const order = await prisma.cartOrder.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) {
      return res.status(404).json({
        error: 'Comanda nu a fost găsită sau nu ți se aparține.',
        code: 'ORDER_NOT_FOUND',
      });
    }

    await prisma.notificationDismissal.upsert({
      where: {
        userId_orderId: { userId, orderId },
      },
      create: { userId, orderId },
      update: {},
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({
      error: 'Eroare la ascunderea notificării',
      code: 'DISMISS_ERROR',
    });
  }
});

module.exports = router;
