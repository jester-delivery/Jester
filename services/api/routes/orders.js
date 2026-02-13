const express = require('express');
const prisma = require('../utils/prisma');
const authenticateToken = require('../middleware/authenticateToken');
const { validate, createOrderSchema, updateOrderStatusSchema } = require('../utils/validation');

const router = express.Router();

/**
 * POST /orders
 * Creează o comandă nouă
 * Protejat cu authenticateToken - necesită utilizator autentificat
 */
router.post('/', authenticateToken, validate(createOrderSchema), async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;
    const userId = req.userId;

    // Verifică că produsele există și sunt disponibile
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        available: true,
      },
    });

    // Verifică dacă toate produsele există și sunt disponibile
    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      
      return res.status(400).json({
        error: 'Unele produse nu există sau nu sunt disponibile',
        code: 'PRODUCTS_NOT_AVAILABLE',
        missingProductIds: missingIds,
      });
    }

    // Calculează total-ul comenzii
    let total = 0;
    const orderItemsData = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      const itemPrice = Number(product.price) * item.quantity;
      total += itemPrice;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      };
    });

    // Creează comanda și order items într-o tranzacție
    const order = await prisma.$transaction(async (tx) => {
      // Creează comanda
      const newOrder = await tx.order.create({
        data: {
          userId,
          status: 'PENDING',
          total,
          deliveryAddress,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: {
            include: {
              product: {
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
              },
            },
          },
        },
      });

      return newOrder;
    });

    res.status(201).json({
      message: 'Comandă creată cu succes',
      order,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      error: 'Eroare la crearea comenzii',
      code: 'CREATE_ORDER_ERROR',
    });
  }
});

/**
 * GET /orders
 * Returnează comenzile utilizatorului autentificat
 * Protejat cu authenticateToken
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { status, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const where = { userId };
    if (status) {
      where.status = status.toUpperCase();
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              product: {
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
              },
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      orders,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      error: 'Eroare la obținerea comenzilor',
      code: 'FETCH_ORDERS_ERROR',
    });
  }
});

/**
 * GET /orders/:id
 * Returnează detaliile unei comenzi specifice
 * Protejat cu authenticateToken - utilizatorul poate vedea doar comenzile sale
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId, // Asigură-te că utilizatorul poate vedea doar comenzile sale
      },
      include: {
        orderItems: {
          include: {
            product: {
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
                    description: true,
                    address: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        error: 'Comandă negăsită sau nu ai permisiunea să o accesezi',
        code: 'ORDER_NOT_FOUND',
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
 * PUT /orders/:id/status
 * Actualizează statusul unei comenzi
 * Protejat cu authenticateToken
 * Notă: În MVP, orice utilizator autentificat poate actualiza statusul
 *       În versiunea Beta, va fi restricționat doar pentru admin/curier
 */
router.put('/:id/status', authenticateToken, validate(updateOrderStatusSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    // Verifică dacă comanda există și aparține utilizatorului
    // (în Beta, va fi permis și pentru admin/curier)
    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: 'Comandă negăsită sau nu ai permisiunea să o actualizezi',
        code: 'ORDER_NOT_FOUND',
      });
    }

    // Actualizează statusul comenzii
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        orderItems: {
          include: {
            product: {
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
            },
          },
        },
      },
    });

    res.json({
      message: 'Statusul comenzii a fost actualizat',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      error: 'Eroare la actualizarea statusului comenzii',
      code: 'UPDATE_ORDER_STATUS_ERROR',
    });
  }
});

module.exports = router;
