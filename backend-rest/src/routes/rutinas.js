import express from 'express';
import { getDB } from '../db/database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/rutinas
 * Crear una nueva rutina (solo autenticados)
 */
router.post('/', authenticateToken, (req, res) => {
  const { nombre, descripcion, nivel, es_publica } = req.body || {};

  // Validaciones
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 3) {
    return res.status(400).json({ error: 'El nombre de la rutina es obligatorio y debe tener al menos 3 caracteres' });
  }

  if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0) {
    return res.status(400).json({ error: 'La descripción de la rutina es obligatoria' });
  }

  const nivelesValidos = ['principiante', 'intermedio', 'avanzado'];
  const nivelFinal = nivel && typeof nivel === 'string' && nivelesValidos.includes(nivel.toLowerCase())
    ? nivel.toLowerCase()
    : 'intermedio';

  const esPublicaFinal = es_publica === undefined ? 1 : (es_publica ? 1 : 0);
  const usuarioId = req.usuario.id;

  const db = getDB();
  const insertStmt = db.prepare(`
    INSERT INTO rutinas (usuario_id, nombre, descripcion, nivel, es_publica)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(usuarioId, nombre.trim(), descripcion.trim(), nivelFinal, esPublicaFinal);
  const nuevaId = Number(result.lastInsertRowid);

  const getStmt = db.prepare(`
    SELECT r.*, u.nombre as creador_nombre 
    FROM rutinas r 
    JOIN usuarios u ON r.usuario_id = u.id 
    WHERE r.id = ?
  `);
  const nuevaRutina = getStmt.get(nuevaId);

  res.status(201)
    .location(`/api/rutinas/${nuevaId}`)
    .json(nuevaRutina);
});

/**
 * GET /api/rutinas
 * Listar y buscar rutinas con paginación y filtros
 */
router.get('/', optionalAuth, (req, res) => {
  const db = getDB();

  // Parámetros de paginación
  let page = parseInt(req.query.page, 10);
  let limit = parseInt(req.query.limit, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1 || limit > 50) limit = 10;
  const offset = (page - 1) * limit;

  // Filtros
  const { q, nivel, es_publica, usuario_id } = req.query;
  const conditions = [];
  const params = [];

  // Visibilidad: Rutinas públicas siempre visibles. Rutinas privadas solo si el usuario autenticado es el creador.
  if (req.usuario) {
    conditions.push('(r.es_publica = 1 OR r.usuario_id = ?)');
    params.push(req.usuario.id);
  } else {
    conditions.push('r.es_publica = 1');
  }

  // Búsqueda por texto (nombre o descripción)
  if (q && typeof q === 'string' && q.trim() !== '') {
    conditions.push('(r.nombre LIKE ? OR r.descripcion LIKE ?)');
    const searchTerm = `%${q.trim()}%`;
    params.push(searchTerm, searchTerm);
  }

  // Filtro por nivel
  if (nivel && typeof nivel === 'string') {
    conditions.push('r.nivel = ?');
    params.push(nivel.toLowerCase());
  }

  // Filtro explícito por es_publica
  if (es_publica !== undefined) {
    const pubVal = (es_publica === 'true' || es_publica === '1' || es_publica === true) ? 1 : 0;
    conditions.push('r.es_publica = ?');
    params.push(pubVal);
  }

  // Filtro por usuario creador
  if (usuario_id !== undefined) {
    const uId = parseInt(usuario_id, 10);
    if (!isNaN(uId)) {
      conditions.push('r.usuario_id = ?');
      params.push(uId);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Conteo total para paginación
  const countSql = `SELECT COUNT(*) as total FROM rutinas r ${whereClause}`;
  const countStmt = db.prepare(countSql);
  const total = countStmt.get(...params).total;

  // Consulta paginada
  const listSql = `
    SELECT r.*, u.nombre as creador_nombre 
    FROM rutinas r 
    JOIN usuarios u ON r.usuario_id = u.id 
    ${whereClause} 
    ORDER BY r.fecha_creacion DESC 
    LIMIT ? OFFSET ?
  `;
  const listStmt = db.prepare(listSql);
  const data = listStmt.all(...params, limit, offset);

  const total_paginas = Math.ceil(total / limit) || 1;

  res.json({
    data,
    paginacion: {
      total,
      pagina: page,
      limite: limit,
      total_paginas
    }
  });
});

/**
 * GET /api/rutinas/:id
 * Obtener detalle de rutina con recurso secundario relacionado (ejercicios asignados)
 */
router.get('/:id', optionalAuth, (req, res) => {
  const rutinaId = parseInt(req.params.id, 10);
  if (isNaN(rutinaId)) {
    return res.status(400).json({ error: 'El id de la rutina debe ser un número entero' });
  }

  const db = getDB();
  const rutinaStmt = db.prepare(`
    SELECT r.*, u.nombre as creador_nombre, u.email as creador_email
    FROM rutinas r
    JOIN usuarios u ON r.usuario_id = u.id
    WHERE r.id = ?
  `);
  const rutina = rutinaStmt.get(rutinaId);

  if (!rutina) {
    return res.status(404).json({ error: 'Rutina no encontrada' });
  }

  // Comprobar visibilidad: si es privada, solo el creador puede verla
  if (rutina.es_publica === 0) {
    if (!req.usuario || req.usuario.id !== rutina.usuario_id) {
      return res.status(403).json({ error: 'No tienes permisos para ver esta rutina privada' });
    }
  }

  // Obtener recurso secundario: ejercicios asignados a la rutina
  const ejerciciosStmt = db.prepare(`
    SELECT 
      re.id as id_rutina_ejercicio,
      re.series_objetivo,
      re.repeticiones_objetivo,
      re.orden,
      e.id as ejercicio_id,
      e.nombre,
      e.grupo_muscular,
      e.equipamiento
    FROM rutina_ejercicios re
    JOIN ejercicios e ON re.ejercicio_id = e.id
    WHERE re.rutina_id = ?
    ORDER BY re.orden ASC, re.id ASC
  `);
  const ejercicios = ejerciciosStmt.all(rutinaId);

  res.json({
    ...rutina,
    ejercicios
  });
});

/**
 * PUT /api/rutinas/:id
 * Modificar rutina existente (solo el creador)
 */
router.put('/:id', authenticateToken, (req, res) => {
  const rutinaId = parseInt(req.params.id, 10);
  if (isNaN(rutinaId)) {
    return res.status(400).json({ error: 'El id de la rutina debe ser un número entero' });
  }

  const db = getDB();
  const currentStmt = db.prepare('SELECT * FROM rutinas WHERE id = ?');
  const actual = currentStmt.get(rutinaId);

  if (!actual) {
    return res.status(404).json({ error: 'Rutina no encontrada' });
  }

  // Restricción de acceso: solo el usuario creador puede modificarla
  if (actual.usuario_id !== req.usuario.id) {
    return res.status(403).json({ error: 'No tienes permiso para modificar una rutina de otro usuario' });
  }

  const { nombre, descripcion, nivel, es_publica } = req.body || {};

  if (nombre !== undefined && (typeof nombre !== 'string' || nombre.trim().length < 3)) {
    return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
  }

  if (descripcion !== undefined && (typeof descripcion !== 'string' || descripcion.trim().length === 0)) {
    return res.status(400).json({ error: 'La descripción no puede estar vacía' });
  }

  const nivelesValidos = ['principiante', 'intermedio', 'avanzado'];
  if (nivel !== undefined && !nivelesValidos.includes(String(nivel).toLowerCase())) {
    return res.status(400).json({ error: 'El nivel debe ser principiante, intermedio o avanzado' });
  }

  const nuevoNombre = nombre !== undefined ? nombre.trim() : actual.nombre;
  const nuevaDesc = descripcion !== undefined ? descripcion.trim() : actual.descripcion;
  const nuevoNivel = nivel !== undefined ? String(nivel).toLowerCase() : actual.nivel;
  const nuevaPublica = es_publica !== undefined ? (es_publica ? 1 : 0) : actual.es_publica;

  const updateStmt = db.prepare(`
    UPDATE rutinas 
    SET nombre = ?, descripcion = ?, nivel = ?, es_publica = ?
    WHERE id = ?
  `);
  updateStmt.run(nuevoNombre, nuevaDesc, nuevoNivel, nuevaPublica, rutinaId);

  const getStmt = db.prepare(`
    SELECT r.*, u.nombre as creador_nombre 
    FROM rutinas r 
    JOIN usuarios u ON r.usuario_id = u.id 
    WHERE r.id = ?
  `);
  const actualizada = getStmt.get(rutinaId);

  res.json({
    mensaje: 'Rutina actualizada correctamente',
    rutina: actualizada
  });
});

/**
 * DELETE /api/rutinas/:id
 * Eliminar rutina (solo el creador)
 */
router.delete('/:id', authenticateToken, (req, res) => {
  const rutinaId = parseInt(req.params.id, 10);
  if (isNaN(rutinaId)) {
    return res.status(400).json({ error: 'El id de la rutina debe ser un número entero' });
  }

  const db = getDB();
  const currentStmt = db.prepare('SELECT * FROM rutinas WHERE id = ?');
  const actual = currentStmt.get(rutinaId);

  if (!actual) {
    return res.status(404).json({ error: 'Rutina no encontrada' });
  }

  // Restricción de acceso: solo el usuario creador puede borrarla
  if (actual.usuario_id !== req.usuario.id) {
    return res.status(403).json({ error: 'No tienes permiso para eliminar una rutina de otro usuario' });
  }

  const deleteStmt = db.prepare('DELETE FROM rutinas WHERE id = ?');
  deleteStmt.run(rutinaId);

  res.status(204).end();
});

// ==========================================
// SUB-RECURSO SECUNDARIO: /api/rutinas/:id/ejercicios
// ==========================================

/**
 * GET /api/rutinas/:id/ejercicios
 * Listar ejercicios asignados a una rutina
 */
router.get('/:id/ejercicios', optionalAuth, (req, res) => {
  const rutinaId = parseInt(req.params.id, 10);
  if (isNaN(rutinaId)) {
    return res.status(400).json({ error: 'El id de la rutina debe ser un número entero' });
  }

  const db = getDB();
  const rutinaStmt = db.prepare('SELECT * FROM rutinas WHERE id = ?');
  const rutina = rutinaStmt.get(rutinaId);

  if (!rutina) {
    return res.status(404).json({ error: 'Rutina no encontrada' });
  }

  if (rutina.es_publica === 0) {
    if (!req.usuario || req.usuario.id !== rutina.usuario_id) {
      return res.status(403).json({ error: 'No tienes permisos para ver los ejercicios de esta rutina privada' });
    }
  }

  const listStmt = db.prepare(`
    SELECT 
      re.id as id_rutina_ejercicio,
      re.rutina_id,
      re.ejercicio_id,
      re.series_objetivo,
      re.repeticiones_objetivo,
      re.orden,
      e.nombre,
      e.grupo_muscular,
      e.equipamiento
    FROM rutina_ejercicios re
    JOIN ejercicios e ON re.ejercicio_id = e.id
    WHERE re.rutina_id = ?
    ORDER BY re.orden ASC, re.id ASC
  `);

  const ejercicios = listStmt.all(rutinaId);
  res.json(ejercicios);
});

/**
 * POST /api/rutinas/:id/ejercicios
 * Asignar un ejercicio a una rutina con series y repeticiones objetivo (solo propietario)
 */
router.post('/:id/ejercicios', authenticateToken, (req, res) => {
  const rutinaId = parseInt(req.params.id, 10);
  if (isNaN(rutinaId)) {
    return res.status(400).json({ error: 'El id de la rutina debe ser un número entero' });
  }

  const db = getDB();
  const rutinaStmt = db.prepare('SELECT * FROM rutinas WHERE id = ?');
  const rutina = rutinaStmt.get(rutinaId);

  if (!rutina) {
    return res.status(404).json({ error: 'Rutina no encontrada' });
  }

  // Restricción de acceso: Solo el dueño de la rutina puede añadirle ejercicios
  if (rutina.usuario_id !== req.usuario.id) {
    return res.status(403).json({ error: 'No tienes permiso para modificar los ejercicios de una rutina de otro usuario' });
  }

  const { ejercicio_id, series_objetivo, repeticiones_objetivo, orden } = req.body || {};

  const ejId = parseInt(ejercicio_id, 10);
  const series = parseInt(series_objetivo, 10);
  const reps = parseInt(repeticiones_objetivo, 10);
  const ordenNum = orden !== undefined ? parseInt(orden, 10) : 1;

  if (isNaN(ejId)) {
    return res.status(400).json({ error: 'Debe especificar un ejercicio_id válido' });
  }

  if (isNaN(series) || series <= 0) {
    return res.status(400).json({ error: 'Las series objetivo deben ser un número entero mayor que 0' });
  }

  if (isNaN(reps) || reps <= 0) {
    return res.status(400).json({ error: 'Las repeticiones objetivo deben ser un número entero mayor que 0' });
  }

  // Verificar que el ejercicio existe en el catálogo
  const ejStmt = db.prepare('SELECT * FROM ejercicios WHERE id = ?');
  const ejercicio = ejStmt.get(ejId);
  if (!ejercicio) {
    return res.status(404).json({ error: 'El ejercicio especificado no existe en el catálogo' });
  }

  const insertStmt = db.prepare(`
    INSERT INTO rutina_ejercicios (rutina_id, ejercicio_id, series_objetivo, repeticiones_objetivo, orden)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = insertStmt.run(rutinaId, ejId, series, reps, isNaN(ordenNum) ? 1 : ordenNum);
  const asignacionId = Number(result.lastInsertRowid);

  const getStmt = db.prepare(`
    SELECT 
      re.id as id_rutina_ejercicio,
      re.rutina_id,
      re.ejercicio_id,
      re.series_objetivo,
      re.repeticiones_objetivo,
      re.orden,
      e.nombre,
      e.grupo_muscular,
      e.equipamiento
    FROM rutina_ejercicios re
    JOIN ejercicios e ON re.ejercicio_id = e.id
    WHERE re.id = ?
  `);
  const asignado = getStmt.get(asignacionId);

  res.status(201).json(asignado);
});

/**
 * DELETE /api/rutinas/:id/ejercicios/:id_ejercicio_rutina
 * Eliminar un ejercicio asignado a una rutina (solo propietario)
 */
router.delete('/:id/ejercicios/:id_ejercicio_rutina', authenticateToken, (req, res) => {
  const rutinaId = parseInt(req.params.id, 10);
  const asignacionId = parseInt(req.params.id_ejercicio_rutina, 10);

  if (isNaN(rutinaId) || isNaN(asignacionId)) {
    return res.status(400).json({ error: 'Los identificadores deben ser números enteros' });
  }

  const db = getDB();
  const rutinaStmt = db.prepare('SELECT * FROM rutinas WHERE id = ?');
  const rutina = rutinaStmt.get(rutinaId);

  if (!rutina) {
    return res.status(404).json({ error: 'Rutina no encontrada' });
  }

  // Restricción de acceso: Solo el dueño de la rutina puede quitar ejercicios
  if (rutina.usuario_id !== req.usuario.id) {
    return res.status(403).json({ error: 'No tienes permiso para eliminar ejercicios de una rutina de otro usuario' });
  }

  const asigStmt = db.prepare('SELECT * FROM rutina_ejercicios WHERE id = ? AND rutina_id = ?');
  const asignacion = asigStmt.get(asignacionId, rutinaId);

  if (!asignacion) {
    return res.status(404).json({ error: 'El ejercicio asignado no fue encontrado en esta rutina' });
  }

  const deleteStmt = db.prepare('DELETE FROM rutina_ejercicios WHERE id = ?');
  deleteStmt.run(asignacionId);

  res.status(204).end();
});

export default router;
