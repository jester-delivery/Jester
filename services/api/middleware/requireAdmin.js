const prisma = require('../utils/prisma');

/**
 * Middleware: verifică dacă user-ul autentificat e admin.
 * Trebuie apelat DUPĂ authenticateToken.
 * ADMIN_EMAILS din .env: emailuri separate prin virgulă (ex: admin@jester.ro,dex@mail.com)
 */
async function requireAdmin(req, res, next) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Autentificare necesară', code: 'AUTH_REQUIRED' });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.length === 0) {
      return res.status(503).json({
        error: 'Admin nu este configurat (ADMIN_EMAILS în .env)',
        code: 'ADMIN_NOT_CONFIGURED',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || !adminEmails.includes(user.email.toLowerCase())) {
      return res.status(403).json({
        error: 'Nu ai permisiunea de admin',
        code: 'ADMIN_FORBIDDEN',
      });
    }

    next();
  } catch (error) {
    console.error('requireAdmin error:', error);
    res.status(500).json({ error: 'Eroare internă', code: 'ADMIN_CHECK_ERROR' });
  }
}

module.exports = requireAdmin;
