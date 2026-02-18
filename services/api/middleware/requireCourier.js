const prisma = require('../utils/prisma');

/**
 * Middleware: verifică dacă user-ul autentificat are rol COURIER sau ADMIN.
 * Trebuie apelat DUPĂ authenticateToken.
 */
async function requireCourier(req, res, next) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Autentificare necesară', code: 'AUTH_REQUIRED' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Utilizator negăsit', code: 'USER_NOT_FOUND' });
    }

    if (user.role !== 'COURIER' && user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Nu ai permisiunea de curier',
        code: 'COURIER_FORBIDDEN',
      });
    }

    req.courierId = user.id;
    next();
  } catch (error) {
    console.error('requireCourier error:', error);
    res.status(500).json({ error: 'Eroare internă', code: 'COURIER_CHECK_ERROR' });
  }
}

module.exports = requireCourier;
