const express = require('express');
const prisma = require('../utils/prisma');

const router = express.Router();

/**
 * GET /categories
 * Returnează lista categoriilor. ?includeProducts=1 = include produse active (pentru catalog client)
 */
router.get('/', async (req, res) => {
  try {
    const includeProducts = req.query.includeProducts === '1';

    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: includeProducts
        ? {
            products: {
              where: { isActive: true },
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
              include: {
                restaurant: { select: { id: true, name: true } },
              },
            },
            _count: { select: { products: true } },
          }
        : {
            _count: { select: { products: true } },
          },
    });

    if (includeProducts) {
      const categoriesWithFlags = categories.map((cat) => ({
        ...cat,
        products: (cat.products || []).map((p) => ({
          ...p,
          isAvailable: p.available,
        })),
      }));
      return res.json({ categories: categoriesWithFlags });
    }

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
            isActive: true,
          },
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'desc' },
          ],
          take: 50,
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

    const categoryWithFlags = {
      ...category,
      products: (category.products || []).map((p) => ({
        ...p,
        isAvailable: p.available,
      })),
    };

    res.json({ category: categoryWithFlags });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      error: 'Eroare la obținerea categoriei',
      code: 'FETCH_CATEGORY_ERROR',
    });
  }
});

module.exports = router;
