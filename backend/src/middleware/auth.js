// middleware/auth.js
// Middleware de autenticación con JWT
const jwt = require('jsonwebtoken');

/**
 * Verifica el token JWT en el header Authorization
 * Agrega req.user con los datos del usuario autenticado
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Verifica que el usuario tenga rol de admin
 */
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly };
