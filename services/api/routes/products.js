const express = require('express');
const prisma = require('../utils/prisma');

const router = express.Router();

/**
 * GET /products
 * Returnează lista de produse cu filtrare și paginare
 * Query params:
 * - category: filtrează după categoryId (slug sau id)
 * - restaurant: filtrează după restaurantId
 * - available: filtrează după disponibilitate (true/false)
 * - page: numărul paginii (default: 1)
 * - limit: numărul de produse pe pagină (default: 20, max: 100)
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      restaurant,
      available,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    // Construiește filtru
    const where = {};

    // Filtrare după categorie (slug sau id)
    if (category) {
      const categoryRecord = await prisma.category.findFirst({
        where: {
          OR: [
            { id: category },
            { slug: category },
          ],
        },
      });

      if (categoryRecord) {
        where.categoryId = categoryRecord.id;
      } else {
        // Dacă categoria nu există, returnează array gol
        return res.json({
          products: [],
          total: 0,
          page: pageNum,
          limit: limitNum,
          totalPages: 0,
        });
      }
    }

    // Filtrare după restaurant
    if (restaurant) {
      where.restaurantId = restaurant;
    }

    // Client: doar produse active (vizibile în magazin)
    where.isActive = true;

    // Filtrare opțională după disponibilitate (pentru admin sau filtre)
    if (available !== undefined) {
      where.available = available === 'true';
    }

    // Query produse cu count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          restaurant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    // Client: expune available ca isAvailable (clar pentru UI)
    const productsWithFlags = products.map((p) => ({
      ...p,
      isAvailable: p.available,
    }));

    res.json({
      products: productsWithFlags,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      error: 'Eroare la obținerea produselor',
      code: 'FETCH_PRODUCTS_ERROR',
    });
  }
});

/**
 * GET /products/:id
 * Returnează detaliile unui produs specific (doar dacă e active)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { id, isActive: true },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            description: true,
            address: true,
            phone: true,
            image: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        error: 'Produs negăsit',
        code: 'PRODUCT_NOT_FOUND',
      });
    }

    res.json({
      product: {
        ...product,
        isAvailable: product.available,
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      error: 'Eroare la obținerea produsului',
      code: 'FETCH_PRODUCT_ERROR',
    });
  }
});

module.exports = router;
