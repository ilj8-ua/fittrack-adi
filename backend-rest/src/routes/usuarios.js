import express from 'express';
import { getDB } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/usuarios/:id
 * Consulta de datos públicos del perfil de un usuario
 */
router.get('/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'El id del usuario debe ser un número entero' });
  }

  const db = getDB();
  const userStmt = db.prepare('SELECT id, nombre, email, bio, fecha_registro FROM usuarios WHERE id = ?');
  const usuario = userStmt.get(userId);

  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json(usuario);
});

/**
 * PUT /api/usuarios/:id
 * Edición del perfil de usuario (solo el propio usuario autenticado)
 */
router.put('/:id', authenticateToken, (req, res) => {
  const targetId = parseInt(req.params.id, 10);

  if (isNaN(targetId)) {
    return res.status(400).json({ error: 'El id del usuario debe ser un número entero' });
  }

  // Restricción de acceso: Solo el propio usuario puede editar su perfil
  if (req.usuario.id !== targetId) {
    return res.status(403).json({ error: 'No tienes permiso para modificar el perfil de otro usuario' });
  }

  const { nombre, bio } = req.body || {};

  if (nombre !== undefined && (typeof nombre !== 'string' || nombre.trim().length < 2)) {
    return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
  }

  if (bio !== undefined && typeof bio !== 'string') {
    return res.status(400).json({ error: 'La biografía debe ser una cadena de texto' });
  }

  const db = getDB();

  // Obtener datos actuales
  const currentStmt = db.prepare('SELECT id, nombre, email, bio, fecha_registro FROM usuarios WHERE id = ?');
  const actual = currentStmt.get(targetId);

  if (!actual) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const nuevoNombre = nombre !== undefined ? nombre.trim() : actual.nombre;
  const nuevaBio = bio !== undefined ? bio.trim() : actual.bio;

  const updateStmt = db.prepare('UPDATE usuarios SET nombre = ?, bio = ? WHERE id = ?');
  updateStmt.run(nuevoNombre, nuevaBio, targetId);

  const actualizado = currentStmt.get(targetId);

  res.json({
    mensaje: 'Perfil actualizado exitosamente',
    usuario: actualizado
  });
});

export default router;
