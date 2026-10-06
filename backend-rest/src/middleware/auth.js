import { verifyJWT } from '../utils/security.js';

/**
 * Middleware que exige autenticación mediante JWT
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Acceso denegado: falta cabecera Authorization' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de cabecera inválido. Debe ser: Bearer <token>' });
  }

  const token = parts[1];

  try {
    const decoded = verifyJWT(token);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: `Token inválido o expirado: ${err.message}` });
  }
}

/**
 * Middleware de autenticación opcional: si viene token válido lo adjunta en req.usuario,
 * si no viene continúa como usuario anónimo (req.usuario = null)
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    req.usuario = null;
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    try {
      req.usuario = verifyJWT(parts[1]);
    } catch {
      req.usuario = null;
    }
  } else {
    req.usuario = null;
  }

  next();
}
