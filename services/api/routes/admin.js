const express = require('express');
const prisma = require('../utils/prisma');
const authenticateToken = require('../middleware/authenticateToken');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

/** Toate rutele admin necesită auth + admin */
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /admin/orders
 * Lista tuturor comenzilor (doar pentru admin)
 */
router.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.cartOrder.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({
      error: 'Eroare la obținerea comenzilor',
      code: 'FETCH_ADMIN_ORDERS_ERROR',
    });
  }
});

module.exports = router;
