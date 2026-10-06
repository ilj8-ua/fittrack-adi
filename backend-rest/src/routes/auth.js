import express from 'express';
import { getDB } from '../db/database.js';
import { hashPassword, verifyPassword, generateJWT } from '../utils/security.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Registro de un nuevo usuario
 */
router.post('/register', (req, res) => {
  const { nombre, email, password, bio } = req.body || {};

  // Validaciones
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
    return res.status(400).json({ error: 'El nombre es obligatorio y debe tener al menos 2 caracteres' });
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Debe proporcionar un email válido' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanNombre = nombre.trim();
  const cleanBio = typeof bio === 'string' ? bio.trim() : '';

  const db = getDB();

  // Verificar unicidad de email
  const existingStmt = db.prepare('SELECT id FROM usuarios WHERE email = ?');
  const existing = existingStmt.get(cleanEmail);

  if (existing) {
    return res.status(409).json({ error: 'Ya existe un usuario registrado con ese email' });
  }

  // Hashear contraseña con salt
  const { hash, salt } = hashPassword(password);

  const insertStmt = db.prepare(`
    INSERT INTO usuarios (nombre, email, password_hash, salt, bio)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(cleanNombre, cleanEmail, hash, salt, cleanBio);
  const nuevoId = Number(result.lastInsertRowid);

  // Obtener datos públicos del usuario insertado
  const userStmt = db.prepare('SELECT id, nombre, email, bio, fecha_registro FROM usuarios WHERE id = ?');
  const usuario = userStmt.get(nuevoId);

  // Generar JWT
  const token = generateJWT({
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre
  });

  res.status(201).json({
    mensaje: 'Usuario registrado exitosamente',
    token,
    usuario
  });
});

/**
 * POST /api/auth/login
 * Inicio de sesión
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Debe ingresar email y contraseña' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const db = getDB();

  const userStmt = db.prepare('SELECT * FROM usuarios WHERE email = ?');
  const usuario = userStmt.get(cleanEmail);

  if (!usuario) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const isValid = verifyPassword(String(password), usuario.password_hash, usuario.salt);

  if (!isValid) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = generateJWT({
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre
  });

  const usuarioPublico = {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    bio: usuario.bio,
    fecha_registro: usuario.fecha_registro
  };

  res.json({
    mensaje: 'Autenticación satisfactoria',
    token,
    usuario: usuarioPublico
  });
});

export default router;
