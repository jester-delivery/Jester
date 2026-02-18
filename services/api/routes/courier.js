const express = require('express');
const prisma = require('../utils/prisma');
const authenticateToken = require('../middleware/authenticateToken');
const requireCourier = require('../middleware/requireCourier');
const { emitOrderStatus } = require('../utils/orderEvents');
const { logOrderStatusChange } = require('../utils/orderStatusLog');

const router = express.Router();

router.use(authenticateToken);
router.use(requireCourier);

/**
 * GET /courier/orders/available
 * Comenzi eligibile: PENDING, assignedCourierId null, ne-refuzate de acest curier
 */
router.get('/orders/available', async (req, res) => {
  try {
    const courierId = req.courierId;

    const rejectedOrderIds = await prisma.courierRejection
      .findMany({
        where: { courierId },
        select: { orderId: true },
      })
      .then((rows) => rows.map((r) => r.orderId));

    const orders = await prisma.cartOrder.findMany({
      where: {
        status: 'PENDING',
        assignedCourierId: null,
        id: rejectedOrderIds.length ? { notIn: rejectedOrderIds } : undefined,
        deletedAt: null,
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ orders });
  } catch (error) {
    console.error('[courier] available:', error);
    res.status(500).json({
      error: 'Eroare la obținerea comenzilor disponibile',
      code: 'COURIER_AVAILABLE_ERROR',
    });
  }
});

/**
 * POST /courier/orders/:id/accept
 * Accept atomic: doar dacă status=PENDING și assignedCourierId=null.
 * Dacă alt curier a acceptat între timp → 409 Conflict "Order already taken".
 */
router.post('/orders/:id/accept', async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const courierId = req.courierId;

    const { count } = await prisma.cartOrder.updateMany({
      where: {
        id: orderId,
        status: 'PENDING',
        assignedCourierId: null,
      },
      data: {
        assignedCourierId: courierId,
        status: 'ACCEPTED',
        courierAcceptedAt: new Date(),
      },
    });

    if (count === 0) {
      const exists = await prisma.cartOrder.findUnique({ where: { id: orderId }, select: { id: true } });
      if (!exists) {
        return res.status(404).json({ error: 'Comandă negăsită', code: 'ORDER_NOT_FOUND' });
      }
      return res.status(409).json({
        error: 'Order already taken',
        code: 'ORDER_ALREADY_TAKEN',
      });
    }

    const updated = await prisma.cartOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (updated) {
      await logOrderStatusChange(orderId, 'PENDING', 'ACCEPTED', courierId);
      emitOrderStatus(updated);
    }

    res.json({ order: updated });
  } catch (error) {
    console.error('[courier] accept:', error);
    res.status(500).json({
      error: 'Eroare la acceptarea comenzii',
      code: 'COURIER_ACCEPT_ERROR',
    });
  }
});

/**
 * POST /courier/orders/:id/refuse
 * Refuz fără a modifica comanda; înregistrăm refuzul ca să nu mai apară la acest curier
 */
router.post('/orders/:id/refuse', async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const courierId = req.courierId;
    const reason = req.body?.reason ? String(req.body.reason).trim().slice(0, 500) : null;

    const order = await prisma.cartOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Comandă negăsită', code: 'ORDER_NOT_FOUND' });
    }
    if (order.status !== 'PENDING' || order.assignedCourierId) {
      return res.status(400).json({
        error: 'Comanda nu poate fi refuzată',
        code: 'ORDER_NOT_REFUSABLE',
      });
    }

    await prisma.courierRejection.upsert({
      where: {
        orderId_courierId: { orderId, courierId },
      },
      create: { orderId, courierId, reason },
      update: { reason, rejectedAt: new Date() },
    });

    const orderWithItems = await prisma.cartOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (orderWithItems) {
      emitOrderStatus(orderWithItems, { reason: 'courier_refused' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[courier] refuse:', error);
    res.status(500).json({
      error: 'Eroare la refuz',
      code: 'COURIER_REFUSE_ERROR',
    });
  }
});

/**
 * GET /courier/orders/mine
 * Comenzile mele: ACCEPTED sau ON_THE_WAY, assignedCourierId = me
 */
router.get('/orders/mine', async (req, res) => {
  try {
    const courierId = req.courierId;

    const orders = await prisma.cartOrder.findMany({
      where: {
        assignedCourierId: courierId,
        status: { in: ['ACCEPTED', 'ON_THE_WAY'] },
      },
      include: { items: true },
      orderBy: { courierAcceptedAt: 'asc' },
    });

    res.json({ orders });
  } catch (error) {
    console.error('[courier] mine:', error);
    res.status(500).json({
      error: 'Eroare la obținerea comenzilor',
      code: 'COURIER_MINE_ERROR',
    });
  }
});

/**
 * GET /courier/orders/history
 * Istoric: DELIVERED pentru acest curier (read-only)
 */
router.get('/orders/history', async (req, res) => {
  try {
    const courierId = req.courierId;

    const orders = await prisma.cartOrder.findMany({
      where: {
        assignedCourierId: courierId,
        status: 'DELIVERED',
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ orders });
  } catch (error) {
    console.error('[courier] history:', error);
    res.status(500).json({
      error: 'Eroare la obținerea istoricului',
      code: 'COURIER_HISTORY_ERROR',
    });
  }
});

/**
 * GET /courier/orders/refused
 * Comenzi refuzate de acest curier (cu rejectedAt și reason)
 */
router.get('/orders/refused', async (req, res) => {
  try {
    const courierId = req.courierId;

    const rejections = await prisma.courierRejection.findMany({
      where: { courierId },
      include: {
        order: { include: { items: true } },
      },
      orderBy: { rejectedAt: 'desc' },
      take: 100,
    });

    const orders = rejections
      .filter((r) => r.order != null)
      .map((r) => ({
        ...r.order,
        rejectedAt: r.rejectedAt,
        refusedReason: r.reason,
        statusDisplay: 'REFUSED',
      }));

    res.json({ orders });
  } catch (error) {
    console.error('[courier] refused:', error);
    res.status(500).json({
      error: 'Eroare la obținerea comenzilor refuzate',
      code: 'COURIER_REFUSED_ERROR',
    });
  }
});

/**
 * GET /courier/orders/:id
 * Detalii comandă (doar dacă e disponibilă, a mea, din istoric sau refuzată de mine)
 */
router.get('/orders/:id', async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const courierId = req.courierId;

    const order = await prisma.cartOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Comandă negăsită', code: 'ORDER_NOT_FOUND' });
    }

    const isAvailable =
      order.status === 'PENDING' &&
      !order.assignedCourierId &&
      !(await prisma.courierRejection.findUnique({
        where: { orderId_courierId: { orderId, courierId } },
      }));
    const isMine = order.assignedCourierId === courierId;
    const isRefusedByMe = await prisma.courierRejection.findUnique({
      where: { orderId_courierId: { orderId, courierId } },
    });

    if (!isAvailable && !isMine && !isRefusedByMe) {
      return res.status(403).json({
        error: 'Nu ai acces la această comandă',
        code: 'COURIER_ORDER_FORBIDDEN',
      });
    }

    const payload = { ...order };
    if (isRefusedByMe) {
      payload.refusedByMe = true;
      payload.rejectedAt = isRefusedByMe.rejectedAt;
      payload.refusedReason = isRefusedByMe.reason;
      payload.statusDisplay = 'REFUSED';
    }
    res.json({ order: payload });
  } catch (error) {
    console.error('[courier] order detail:', error);
    res.status(500).json({
      error: 'Eroare la obținerea comenzii',
      code: 'COURIER_ORDER_ERROR',
    });
  }
});

/**
 * POST /courier/orders/:id/status
 * Body: { status: 'ON_THE_WAY' | 'DELIVERED' }
 * Doar pentru comenzi atribuite mie. Tranziții: ACCEPTED -> ON_THE_WAY, ON_THE_WAY -> DELIVERED
 */
router.post('/orders/:id/status', async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const courierId = req.courierId;
    const { status: newStatus } = req.body;

    if (!['ON_THE_WAY', 'DELIVERED'].includes(newStatus)) {
      return res.status(400).json({
        error: 'Status invalid. Alege ON_THE_WAY sau DELIVERED',
        code: 'INVALID_STATUS',
      });
    }

    const order = await prisma.cartOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Comandă negăsită', code: 'ORDER_NOT_FOUND' });
    }
    if (order.assignedCourierId !== courierId) {
      return res.status(403).json({
        error: 'Nu poți modifica această comandă',
        code: 'COURIER_ORDER_FORBIDDEN',
      });
    }

    const allowed = {
      ACCEPTED: ['ON_THE_WAY'],
      ON_THE_WAY: ['DELIVERED'],
    };
    if (!allowed[order.status]?.includes(newStatus)) {
      return res.status(400).json({
        error: `Tranziție invalidă: ${order.status} -> ${newStatus}`,
        code: 'INVALID_TRANSITION',
      });
    }

    const updated = await prisma.cartOrder.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: { items: true },
    });

    await logOrderStatusChange(orderId, order.status, newStatus, courierId);
    emitOrderStatus(updated);

    res.json({ order: updated });
  } catch (error) {
    console.error('[courier] status:', error);
    res.status(500).json({
      error: 'Eroare la actualizarea statusului',
      code: 'COURIER_STATUS_ERROR',
    });
  }
});

module.exports = router;
