const express = require('express');
const prisma = require('../utils/prisma');
const authenticateToken = require('../middleware/authenticateToken');
const requireAdmin = require('../middleware/requireAdmin');
const { validate, updateProductSchema, updateCategorySchema } = require('../utils/validation');

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

/**
 * GET /admin/products
 * Lista produselor cu: search (nume), category, isActive, available. Sortare: sortOrder apoi name.
 */
router.get('/products', async (req, res) => {
  try {
    const { category: categorySlugOrId, search, isActive, available } = req.query;
    const where = {};

    if (categorySlugOrId) {
      const cat = await prisma.category.findFirst({
        where: {
          OR: [{ id: categorySlugOrId }, { slug: categorySlugOrId }],
        },
      });
      if (cat) where.categoryId = cat.id;
    }
    if (search != null && String(search).trim() !== '') {
      where.name = { contains: String(search).trim(), mode: 'insensitive' };
    }
    if (isActive === 'true' || isActive === '1') where.isActive = true;
    if (isActive === 'false' || isActive === '0') where.isActive = false;
    if (available === 'true' || available === '1') where.available = true;
    if (available === 'false' || available === '0') where.available = false;

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        restaurant: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });
    res.json({ products });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({
      error: 'Eroare la obținerea produselor',
      code: 'FETCH_ADMIN_PRODUCTS_ERROR',
    });
  }
});

/**
 * PATCH /admin/products/:id
 * CRUD complet: name, description, price, image, categorySlug, isActive, available, sortOrder, stock
 */
router.patch('/products/:id', validate(updateProductSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, categorySlug, isActive, available, sortOrder, stock } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({
        error: 'Produs negăsit',
        code: 'PRODUCT_NOT_FOUND',
      });
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = price;
    if (image !== undefined) data.image = image;
    if (isActive !== undefined) data.isActive = isActive;
    if (available !== undefined) data.available = available;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (stock !== undefined) data.stock = stock;

    if (categorySlug !== undefined) {
      const cat = await prisma.category.findFirst({
        where: { OR: [{ slug: categorySlug }, { id: categorySlug }] },
      });
      if (!cat) {
        return res.status(400).json({
          error: 'Categorie negăsită pentru slug: ' + categorySlug,
          code: 'CATEGORY_NOT_FOUND',
        });
      }
      data.categoryId = cat.id;
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        restaurant: { select: { id: true, name: true } },
      },
    });
    res.json({ product: updated });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      error: 'Eroare la actualizarea produsului',
      code: 'UPDATE_PRODUCT_ERROR',
    });
  }
});

/**
 * POST /admin/products/bulk-activate
 * Body: { categoryId?: string } – activează toate produsele (opțional doar din categorie)
 */
router.post('/products/bulk-activate', async (req, res) => {
  try {
    const { categoryId } = req.body || {};
    const where = categoryId ? { categoryId } : {};
    const result = await prisma.product.updateMany({
      where,
      data: { isActive: true },
    });
    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error bulk activate:', error);
    res.status(500).json({
      error: 'Eroare la activare în masă',
      code: 'BULK_ACTIVATE_ERROR',
    });
  }
});

/**
 * POST /admin/products/bulk-deactivate
 * Body: { categoryId?: string } – dezactivează toate produsele (opțional doar din categorie)
 */
router.post('/products/bulk-deactivate', async (req, res) => {
  try {
    const { categoryId } = req.body || {};
    const where = categoryId ? { categoryId } : {};
    const result = await prisma.product.updateMany({
      where,
      data: { isActive: false },
    });
    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error bulk deactivate:', error);
    res.status(500).json({
      error: 'Eroare la dezactivare în masă',
      code: 'BULK_DEACTIVATE_ERROR',
    });
  }
});

/**
 * GET /admin/stats/today
 * Agregare: total comenzi azi, total livrate azi (din OrderStatusLog), total valoare livrată azi
 */
router.get('/stats/today', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [totalOrdersToday, deliveredLogsToday] = await Promise.all([
      prisma.cartOrder.count({
        where: {
          createdAt: { gte: startOfToday, lte: endOfToday },
          deletedAt: null,
        },
      }),
      prisma.orderStatusLog.findMany({
        where: {
          newStatus: 'DELIVERED',
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
        select: { orderId: true },
      }),
    ]);

    const deliveredOrderIds = [...new Set(deliveredLogsToday.map((l) => l.orderId))];
    const totalDeliveredToday = deliveredOrderIds.length;

    let totalValueDeliveredToday = 0;
    if (deliveredOrderIds.length > 0) {
      const orders = await prisma.cartOrder.findMany({
        where: { id: { in: deliveredOrderIds }, status: 'DELIVERED', deletedAt: null },
        select: { total: true },
      });
      totalValueDeliveredToday = orders.reduce((sum, o) => sum + Number(o.total), 0);
    }

    res.json({
      totalOrdersToday,
      totalDeliveredToday,
      totalValueDeliveredToday: Math.round(totalValueDeliveredToday * 100) / 100,
    });
  } catch (error) {
    console.error('Error admin stats/today:', error);
    res.status(500).json({
      error: 'Eroare la statistici',
      code: 'ADMIN_STATS_ERROR',
    });
  }
});

/**
 * GET /admin/categories
 * Lista tuturor categoriilor (inclusiv inactive) – pentru Categories Manager
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    res.status(500).json({
      error: 'Eroare la obținerea categoriilor',
      code: 'FETCH_ADMIN_CATEGORIES_ERROR',
    });
  }
});

/**
 * PATCH /admin/categories/:id
 * Edit: name (title), description, image (icon), isActive, sortOrder
 */
router.patch('/categories/:id', validate(updateCategorySchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, isActive, sortOrder } = req.body;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({
        error: 'Categorie negăsită',
        code: 'CATEGORY_NOT_FOUND',
      });
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (image !== undefined) data.image = image;
    if (isActive !== undefined) data.isActive = isActive;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const updated = await prisma.category.update({
      where: { id },
      data,
      include: { _count: { select: { products: true } } },
    });
    res.json({ category: updated });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      error: 'Eroare la actualizarea categoriei',
      code: 'UPDATE_CATEGORY_ERROR',
    });
  }
});

module.exports = router;
