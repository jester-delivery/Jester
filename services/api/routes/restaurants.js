const express = require('express');
const prisma = require('../utils/prisma');

const router = express.Router();

/**
 * GET /restaurants
 * Returnează lista tuturor restaurantelor
 */
router.get('/', async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    res.json({ restaurants });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({
      error: 'Eroare la obținerea restaurantelor',
      code: 'FETCH_RESTAURANTS_ERROR',
    });
  }
});

/**
 * GET /restaurants/:id
 * Returnează detaliile unui restaurant specific
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        products: {
          where: {
            available: true,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!restaurant) {
      return res.status(404).json({
        error: 'Restaurant negăsit',
        code: 'RESTAURANT_NOT_FOUND',
      });
    }

    res.json({ restaurant });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({
      error: 'Eroare la obținerea restaurantului',
      code: 'FETCH_RESTAURANT_ERROR',
    });
  }
});

module.exports = router;
