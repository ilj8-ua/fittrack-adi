import crypto from 'node:crypto';
import { JWT_SECRET } from '../config.js';

// Base64Url encode/decode helpers para JWT estándar RFC 7519
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Hashea una contraseña con un salt único usando PBKDF2/SHA-256
 */
export function hashPassword(password, existingSalt = null) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return { hash, salt };
}

/**
 * Verifica si una contraseña coincide con el hash y salt guardados
 */
export function verifyPassword(password, savedHash, savedSalt) {
  const { hash } = hashPassword(password, savedSalt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(savedHash, 'hex'));
}

/**
 * Genera un token JWT firmado con HMAC SHA-256
 */
export function generateJWT(payload, expiresInSeconds = 86400) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dataToSign}.${signature}`;
}

/**
 * Verifica y decodifica un token JWT
 */
export function verifyJWT(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token no proporcionado');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Formato de token JWT inválido');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSignature) {
    throw new Error('Firma de token inválida');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    throw new Error('El token ha expirado');
  }

  return payload;
}
