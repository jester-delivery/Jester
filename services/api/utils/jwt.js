const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Generează un JWT token pentru un utilizator
 * @param {Object} payload - Payload-ul token-ului (de obicei userId)
 * @returns {string} JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Token-ul expiră în 7 zile
  });
}

/**
 * Verifică și decodează un JWT token
 * @param {string} token - JWT token de verificat
 * @returns {Object|null} Payload-ul decodat sau null dacă token-ul este invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken,
};
