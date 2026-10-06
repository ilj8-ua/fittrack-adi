import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { DB_PATH } from '../config.js';

let activeDB = null;

export function initDB(customPath = null) {
  const dbLocation = customPath || DB_PATH;

  if (dbLocation !== ':memory:') {
    const dir = path.dirname(dbLocation);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbLocation);

  // Activar claves foráneas en SQLite
  db.exec('PRAGMA foreign_keys = ON;');

  // Crear esquema de tablas
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      bio TEXT DEFAULT '',
      fecha_registro TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ejercicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      grupo_muscular TEXT NOT NULL,
      equipamiento TEXT NOT NULL,
      creador_id INTEGER,
      FOREIGN KEY (creador_id) REFERENCES usuarios(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS rutinas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      nivel TEXT NOT NULL DEFAULT 'intermedio',
      es_publica INTEGER NOT NULL DEFAULT 1,
      fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rutina_ejercicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rutina_id INTEGER NOT NULL,
      ejercicio_id INTEGER NOT NULL,
      series_objetivo INTEGER NOT NULL CHECK (series_objetivo > 0),
      repeticiones_objetivo INTEGER NOT NULL CHECK (repeticiones_objetivo > 0),
      orden INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE CASCADE,
      FOREIGN KEY (ejercicio_id) REFERENCES ejercicios(id) ON DELETE CASCADE
    );
  `);

  // Sembrar catálogo inicial si está vacío
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM ejercicios');
  const count = countStmt.get().count;

  if (count === 0) {
    const insertEj = db.prepare(`
      INSERT INTO ejercicios (nombre, grupo_muscular, equipamiento, creador_id)
      VALUES (?, ?, ?, NULL)
    `);

    insertEj.run('Press de banca plano', 'Pecho', 'Barra y banco plano');
    insertEj.run('Sentadilla trasera', 'Piernas', 'Barra y rack');
    insertEj.run('Peso muerto convencional', 'Espalda / Piernas', 'Barra');
    insertEj.run('Press militar de pie', 'Hombros', 'Barra');
    insertEj.run('Dominadas pronas', 'Espalda', 'Barra de dominadas');
    insertEj.run('Fondos en paralelas', 'Pecho / Tríceps', 'Barras paralelas');
    insertEj.run('Curl de bíceps con mancuernas', 'Bíceps', 'Mancuernas');
    insertEj.run('Elevaciones laterales', 'Hombros', 'Mancuernas');
  }

  activeDB = db;
  return db;
}

export function getDB() {
  if (!activeDB) {
    activeDB = initDB();
  }
  return activeDB;
}

export function closeDB() {
  if (activeDB) {
    activeDB.close();
    activeDB = null;
  }
}
