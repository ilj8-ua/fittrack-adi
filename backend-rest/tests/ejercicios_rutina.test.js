import test from 'node:test';
import assert from 'node:assert/strict';
import { initDB, closeDB } from '../src/db/database.js';
import { createApp } from '../src/app.js';

test('Iteración 04: Recurso Secundario (Ejercicios y Asignaciones a Rutina)', async (t) => {
  let server;
  let baseUrl;
  let db;
  let tokenUser1;
  let user1;
  let tokenUser2;
  let user2;
  let rutina1;

  t.beforeEach(async () => {
    db = initDB(':memory:');
    const app = createApp(db);
    server = app.listen(0);
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    // Registrar Usuario 1
    const reg1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Iván L', email: 'ivan@test.com', password: 'password123' })
    });
    const d1 = await reg1.json();
    tokenUser1 = d1.token;
    user1 = d1.usuario;

    // Registrar Usuario 2
    const reg2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Carlos M', email: 'carlos@test.com', password: 'password123' })
    });
    const d2 = await reg2.json();
    tokenUser2 = d2.token;
    user2 = d2.usuario;

    // Crear rutina con Usuario 1
    const rRes = await fetch(`${baseUrl}/api/rutinas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`
      },
      body: JSON.stringify({
        nombre: 'Rutina Base Piernas',
        descripcion: 'Sentadilla y extensiones',
        es_publica: true
      })
    });
    rutina1 = await rRes.json();
  });

  t.afterEach(() => {
    server.close();
    closeDB();
  });

  await t.test('Debe listar catálogo de ejercicios y permitir filtrado por grupo muscular', async () => {
    // Listado general
    const res = await fetch(`${baseUrl}/api/ejercicios`);
    assert.equal(res.status, 200);
    const ejercicios = await res.json();
    assert.ok(ejercicios.length >= 8, 'Debe haber al menos 8 ejercicios');

    // Filtro por grupo muscular Pecho
    const resPecho = await fetch(`${baseUrl}/api/ejercicios?grupo_muscular=Pecho`);
    assert.equal(resPecho.status, 200);
    const ejerciciosPecho = await resPecho.json();
    assert.ok(ejerciciosPecho.length >= 1);
    for (const ej of ejerciciosPecho) {
      assert.match(ej.grupo_muscular, /Pecho/i);
    }
  });

  await t.test('Debe permitir crear un nuevo ejercicio en el catálogo (201 Created)', async () => {
    const res = await fetch(`${baseUrl}/api/ejercicios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`
      },
      body: JSON.stringify({
        nombre: 'Hip Thrust con barra',
        grupo_muscular: 'Glúteos / Piernas',
        equipamiento: 'Barra y banco'
      })
    });

    assert.equal(res.status, 201);
    const nuevo = await res.json();
    assert.equal(nuevo.nombre, 'Hip Thrust con barra');
    assert.equal(nuevo.creador_id, user1.id);
  });

  await t.test('Debe asignar un ejercicio a la rutina con series y repeticiones válidas (201)', async () => {
    const res = await fetch(`${baseUrl}/api/rutinas/${rutina1.id}/ejercicios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`
      },
      body: JSON.stringify({
        ejercicio_id: 2, // Sentadilla trasera
        series_objetivo: 4,
        repeticiones_objetivo: 8,
        orden: 1
      })
    });

    assert.equal(res.status, 201);
    const asignacion = await res.json();
    assert.equal(asignacion.rutina_id, rutina1.id);
    assert.equal(asignacion.ejercicio_id, 2);
    assert.equal(asignacion.series_objetivo, 4);
    assert.equal(asignacion.repeticiones_objetivo, 8);
    assert.equal(asignacion.nombre, 'Sentadilla trasera');
  });

  await t.test('Debe validar series y repeticiones positivas (> 0) al asignar ejercicio (400)', async () => {
    const res = await fetch(`${baseUrl}/api/rutinas/${rutina1.id}/ejercicios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`
      },
      body: JSON.stringify({
        ejercicio_id: 2,
        series_objetivo: 0, // Inválido
        repeticiones_objetivo: 10
      })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /mayor que 0/i);
  });

  await t.test('Debe denegar asignación de ejercicio si el usuario no es el dueño de la rutina (403)', async () => {
    const res = await fetch(`${baseUrl}/api/rutinas/${rutina1.id}/ejercicios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser2}` // Usuario 2 intentando modificar rutina de Usuario 1
      },
      body: JSON.stringify({
        ejercicio_id: 1,
        series_objetivo: 3,
        repeticiones_objetivo: 12
      })
    });

    assert.equal(res.status, 403);
    const data = await res.json();
    assert.match(data.error, /No tienes permiso/i);
  });

  await t.test('Debe listar los ejercicios asignados a una rutina (GET /api/rutinas/:id/ejercicios)', async () => {
    // Añadir 2 ejercicios
    await fetch(`${baseUrl}/api/rutinas/${rutina1.id}/ejercicios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`
      },
      body: JSON.stringify({ ejercicio_id: 1, series_objetivo: 4, repeticiones_objetivo: 10, orden: 1 })
    });

    await fetch(`${baseUrl}/api/rutinas/${rutina1.id}/ejercicios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`
      },
      body: JSON.stringify({ ejercicio_id: 2, series_objetivo: 3, repeticiones_objetivo: 12, orden: 2 })
    });

    const listRes = await fetch(`${baseUrl}/api/rutinas/${rutina1.id}/ejercicios`);
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.length, 2);
    assert.equal(listData[0].ejercicio_id, 1);
    assert.equal(listData[1].ejercicio_id, 2);
  });

  await t.test('Debe permitir eliminar un ejercicio de la rutina al dueño y denegar a terceros', async () => {
    // Añadir ejercicio
    const addRes = await fetch(`${baseUrl}/api/rutinas/${rutina1.id}/ejercicios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`
      },
      body: JSON.stringify({ ejercicio_id: 1, series_objetivo: 3, repeticiones_objetivo: 10 })
    });
    const asignado = await addRes.json();

    // Intento de borrado por Usuario 2 -> 403 Forbidden
    const delRes2 = await fetch(`${baseUrl}/api/rutinas/${rutina1.id}/ejercicios/${asignado.id_rutina_ejercicio}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenUser2}` }
    });
    assert.equal(delRes2.status, 403);

    // Borrado por Usuario 1 (dueño) -> 204 No Content
    const delRes1 = await fetch(`${baseUrl}/api/rutinas/${rutina1.id}/ejercicios/${asignado.id_rutina_ejercicio}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenUser1}` }
    });
    assert.equal(delRes1.status, 204);

    // Comprobar que la lista de ejercicios de la rutina queda vacía
    const listRes = await fetch(`${baseUrl}/api/rutinas/${rutina1.id}/ejercicios`);
    const listData = await listRes.json();
    assert.equal(listData.length, 0);
  });
});
