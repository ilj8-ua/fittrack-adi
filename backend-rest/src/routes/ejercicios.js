import express from 'express';
import { getDB } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/ejercicios
 * Listar catálogo de ejercicios con filtro opcional por grupo_muscular
 */
router.get('/', (req, res) => {
  const { grupo_muscular } = req.query;
  const db = getDB();

  let sql = 'SELECT * FROM ejercicios';
  const params = [];

  if (grupo_muscular && typeof grupo_muscular === 'string' && grupo_muscular.trim() !== '') {
    sql += ' WHERE LOWER(grupo_muscular) LIKE ?';
    params.push(`%${grupo_muscular.trim().toLowerCase()}%`);
  }

  sql += ' ORDER BY nombre ASC';
  const stmt = db.prepare(sql);
  const ejercicios = stmt.all(...params);

  res.json(ejercicios);
});

/**
 * POST /api/ejercicios
 * Crear un nuevo ejercicio en el catálogo (autenticado)
 */
router.post('/', authenticateToken, (req, res) => {
  const { nombre, grupo_muscular, equipamiento } = req.body || {};

  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
    return res.status(400).json({ error: 'El nombre del ejercicio es obligatorio y debe tener al menos 2 caracteres' });
  }

  if (!grupo_muscular || typeof grupo_muscular !== 'string' || grupo_muscular.trim().length === 0) {
    return res.status(400).json({ error: 'El grupo muscular es obligatorio' });
  }

  if (!equipamiento || typeof equipamiento !== 'string' || equipamiento.trim().length === 0) {
    return res.status(400).json({ error: 'El equipamiento es obligatorio' });
  }

  const db = getDB();
  const insertStmt = db.prepare(`
    INSERT INTO ejercicios (nombre, grupo_muscular, equipamiento, creador_id)
    VALUES (?, ?, ?, ?)
  `);

  const result = insertStmt.run(nombre.trim(), grupo_muscular.trim(), equipamiento.trim(), req.usuario.id);
  const nuevoId = Number(result.lastInsertRowid);

  const getStmt = db.prepare('SELECT * FROM ejercicios WHERE id = ?');
  const nuevoEjercicio = getStmt.get(nuevoId);

  res.status(201).json(nuevoEjercicio);
});

export default router;
