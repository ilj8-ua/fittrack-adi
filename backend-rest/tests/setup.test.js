import test from 'node:test';
import assert from 'node:assert/strict';
import { initDB, closeDB } from '../src/db/database.js';
import { createApp } from '../src/app.js';

test('Iteración 01: Setup y Base de Datos', async (t) => {
  await t.test('Debe inicializar la base de datos en memoria y crear tablas', () => {
    const db = initDB(':memory:');
    assert.ok(db, 'La base de datos debería estar inicializada');

    // Verificar existencia de tablas
    const tablesStmt = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
    `);
    const tables = tablesStmt.all().map(r => r.name);

    assert.ok(tables.includes('usuarios'), 'Debe existir tabla usuarios');
    assert.ok(tables.includes('ejercicios'), 'Debe existir tabla ejercicios');
    assert.ok(tables.includes('rutinas'), 'Debe existir tabla rutinas');
    assert.ok(tables.includes('rutina_ejercicios'), 'Debe existir tabla rutina_ejercicios');

    // Verificar catálogo inicial de ejercicios
    const ejStmt = db.prepare('SELECT COUNT(*) as total FROM ejercicios');
    const totalEj = ejStmt.get().total;
    assert.ok(totalEj >= 8, 'Debe sembrar al menos 8 ejercicios iniciales');

    closeDB();
  });

  await t.test('Debe responder al endpoint GET /api/health', async () => {
    const db = initDB(':memory:');
    const app = createApp(db);

    // Levantar servidor temporal en puerto libre para prueba HTTP
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      assert.equal(res.status, 200);

      const data = await res.json();
      assert.equal(data.status, 'ok');
      assert.equal(data.app, 'FitTrack API');
      assert.ok(data.timestamp);
    } finally {
      server.close();
      closeDB();
    }
  });

  await t.test('Debe retornar 404 para rutas inexistentes', async () => {
    const db = initDB(':memory:');
    const app = createApp(db);

    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/ruta-inexistente`);
      assert.equal(res.status, 404);

      const data = await res.json();
      assert.equal(data.error, 'Ruta no encontrada');
    } finally {
      server.close();
      closeDB();
    }
  });
});
