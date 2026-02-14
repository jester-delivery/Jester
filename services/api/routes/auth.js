const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const { generateToken } = require('../utils/jwt');
const { validate, registerSchema, loginSchema } = require('../utils/validation');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

/**
 * POST /auth/register
 * Înregistrează un utilizator nou
 */
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // Verifică dacă email-ul există deja
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Email deja folosit',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }

    // Hash password cu bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Creează utilizatorul în baza de date
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        // Nu returnăm passwordHash
      },
    });

    // Generează JWT token
    const token = generateToken({ userId: user.id, email: user.email });

    res.status(201).json({
      message: 'Utilizator înregistrat cu succes',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      error: 'Eroare la înregistrare',
      code: 'REGISTRATION_ERROR',
    });
  }
});

/**
 * POST /auth/login
 * Autentifică un utilizator existent
 */
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Găsește utilizatorul după email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Parolă greșită sau cont inexistent',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Verifică parola
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Parolă greșită sau cont inexistent',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Generează JWT token
    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      message: 'Autentificare reușită',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      error: 'Eroare la autentificare',
      code: 'LOGIN_ERROR',
    });
  }
});

/**
 * GET /auth/me
 * Returnează informațiile utilizatorului autentificat
 * Protejat cu authenticateToken middleware
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Găsește utilizatorul în baza de date
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        // Nu returnăm passwordHash
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Utilizator negăsit',
        code: 'USER_NOT_FOUND',
      });
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'Eroare la obținerea informațiilor utilizatorului',
      code: 'FETCH_USER_ERROR',
    });
  }
});

module.exports = router;
