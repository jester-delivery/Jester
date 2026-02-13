const express = require('express');
const prisma = require('../utils/prisma');

const router = express.Router();

/**
 * GET /categories
 * Returnează lista tuturor categoriilor
 */
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
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

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Eroare la obținerea categoriilor',
      code: 'FETCH_CATEGORIES_ERROR',
    });
  }
});

/**
 * GET /categories/:id sau /categories/:slug
 * Returnează detaliile unei categorii
 */
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier },
        ],
      },
      include: {
        products: {
          where: {
            available: true,
          },
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 10, // Limitează la 10 produse pentru preview
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        error: 'Categorie negăsită',
        code: 'CATEGORY_NOT_FOUND',
      });
    }

    res.json({ category });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      error: 'Eroare la obținerea categoriei',
      code: 'FETCH_CATEGORY_ERROR',
    });
  }
});

module.exports = router;
