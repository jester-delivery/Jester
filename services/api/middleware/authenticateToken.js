const { verifyToken } = require('../utils/jwt');

/**
 * Middleware pentru autentificare JWT
 * Verifică dacă request-ul are un token JWT valid în header-ul Authorization
 * Dacă token-ul este valid, adaugă userId în req.user
 * Dacă token-ul este invalid sau lipsește, returnează 401
 */
function authenticateToken(req, res, next) {
  // Extrage token-ul din header-ul Authorization
  // Format: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('[auth] 401', req.method, req.originalUrl || req.url, 'AUTH_TOKEN_MISSING');
    return res.status(401).json({ 
      error: 'Token de autentificare lipsă',
      code: 'AUTH_TOKEN_MISSING'
    });
  }

  // Verifică token-ul
  const decoded = verifyToken(token);
  
  if (!decoded) {
    console.log('[auth] 401', req.method, req.originalUrl || req.url, 'AUTH_TOKEN_INVALID');
    return res.status(401).json({ 
      error: 'Token de autentificare invalid sau expirat',
      code: 'AUTH_TOKEN_INVALID'
    });
  }

  // Adaugă userId în request pentru a fi folosit în route handlers
  req.userId = decoded.userId;
  req.user = decoded; // Poți adăuga și alte informații din token dacă e necesar
  
  next();
}

module.exports = authenticateToken;
