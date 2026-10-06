import test from 'node:test';
import assert from 'node:assert/strict';
import { initDB, closeDB } from '../src/db/database.js';
import { createApp } from '../src/app.js';

test('Iteración 03: CRUD de Rutinas, Paginación, Búsqueda y Permisos', async (t) => {
  let server;
  let baseUrl;
  let db;
  let tokenUser1;
  let user1;
  let tokenUser2;
  let user2;

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
  });

  t.afterEach(() => {
    server.close();
    closeDB();
  });

  await t.test('Debe crear una rutina pública exitosamente (201 Created)', async () => {
    const res = await fetch(`${baseUrl}/api/rutinas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`
      },
      body: JSON.stringify({
        nombre: 'Torso Hipertrofia',
        descripcion: 'Enfocada en pecho, espalda y deltoides lateral',
        nivel: 'intermedio',
        es_publica: true
      })
    });

    assert.equal(res.status, 201);
    assert.ok(res.headers.get('location'));
    const rutina = await res.json();
    assert.equal(rutina.nombre, 'Torso Hipertrofia');
    assert.equal(rutina.usuario_id, user1.id);
    assert.equal(rutina.es_publica, 1);
    assert.equal(rutina.creador_nombre, 'Iván L');
  });

  await t.test('Debe rechazar la creación de rutina sin autenticación (401)', async () => {
    const res = await fetch(`${baseUrl}/api/rutinas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Rutina Anónima',
        descripcion: 'Sin auth'
      })
    });
    assert.equal(res.status, 401);
  });

  await t.test('Debe validar campos requeridos al crear rutina (400)', async () => {
    const res = await fetch(`${baseUrl}/api/rutinas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`
      },
      body: JSON.stringify({
        nombre: 'ab', // Demasiado corto
        descripcion: ''
      })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error);
  });

  await t.test('Debe listar rutinas paginadas y soportar búsqueda (?q=)', async () => {
    // Insertar 5 rutinas con Usuario 1
    const rutinas = [
      { nombre: 'Fuerza 5x5', descripcion: 'Sentadilla, banca y peso muerto', nivel: 'intermedio' },
      { nombre: 'Hipertrofia Pecho', descripcion: 'Press inclinado y aperturas', nivel: 'avanzado' },
      { nombre: 'Pierna Cuádriceps', descripcion: 'Sentadillas y prensa', nivel: 'intermedio' },
      { nombre: 'Espalda y Bíceps', descripcion: 'Dominadas y remos', nivel: 'principiante' },
      { nombre: 'Full Body A', descripcion: 'Cuerpo completo general', nivel: 'principiante' }
    ];

    for (const r of rutinas) {
      await fetch(`${baseUrl}/api/rutinas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenUser1}`
        },
        body: JSON.stringify(r)
      });
    }

    // Probar paginación: límite 2, página 1
    const resPage1 = await fetch(`${baseUrl}/api/rutinas?limit=2&page=1`);
    assert.equal(resPage1.status, 200);
    const data1 = await resPage1.json();
    assert.equal(data1.data.length, 2);
    assert.equal(data1.paginacion.total, 5);
    assert.equal(data1.paginacion.pagina, 1);
    assert.equal(data1.paginacion.total_paginas, 3);

    // Probar búsqueda con filtro q=Pecho
    const resSearch = await fetch(`${baseUrl}/api/rutinas?q=Pecho`);
    assert.equal(resSearch.status, 200);
    const dataSearch = await resSearch.json();
    assert.equal(dataSearch.data.length, 1);
    assert.equal(dataSearch.data[0].nombre, 'Hipertrofia Pecho');
  });

  await t.test('Debe devolver el detalle de la rutina con su recurso secundario (ejercicios)', async () => {
    // Crear rutina
    const rRes = await fetch(`${baseUrl}/api/rutinas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`
      },
      body: JSON.stringify({
        nombre: 'Torso Pesado',
        descripcion: 'Fuerza máxima',
        es_publica: true
      })
    });
    const rutina = await rRes.json();

    // Asignar ejercicio directamente en BD para verificar anidación
    db.prepare(`
      INSERT INTO rutina_ejercicios (rutina_id, ejercicio_id, series_objetivo, repeticiones_objetivo, orden)
      VALUES (?, 1, 4, 6, 1)
    `).run(rutina.id);

    // Consultar detalle
    const getRes = await fetch(`${baseUrl}/api/rutinas/${rutina.id}`);
    assert.equal(getRes.status, 200);
    const detalle = await getRes.json();
    assert.equal(detalle.id, rutina.id);
    assert.equal(detalle.nombre, 'Torso Pesado');
    assert.ok(Array.isArray(detalle.ejercicios), 'Debe incluir array de ejercicios');
    assert.equal(detalle.ejercicios.length, 1);
    assert.equal(detalle.ejercicios[0].nombre, 'Press de banca plano');
    assert.equal(detalle.ejercicios[0].series_objetivo, 4);
    assert.equal(detalle.ejercicios[0].repeticiones_objetivo, 6);
  });

  await t.test('Debe proteger rutinas privadas contra accesos no autorizados (403)', async () => {
    // Usuario 1 crea rutina privada
    const rRes = await fetch(`${baseUrl}/api/rutinas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`
      },
      body: JSON.stringify({
        nombre: 'Rutina Secreta',
        descripcion: 'Privada',
        es_publica: false
      })
    });
    const rutina = await rRes.json();

    // Usuario 2 intenta consultarla -> 403 Forbidden
    const unauthGet = await fetch(`${baseUrl}/api/rutinas/${rutina.id}`, {
      headers: { 'Authorization': `Bearer ${tokenUser2}` }
    });
    assert.equal(unauthGet.status, 403);

    // Usuario 1 (propietario) la consulta con éxito
    const authGet = await fetch(`${baseUrl}/api/rutinas/${rutina.id}`, {
      headers: { 'Authorization': `Bearer ${tokenUser1}` }
    });
    assert.equal(authGet.status, 200);
  });

  await t.test('Debe permitir modificar rutina al propietario y rechazar a terceros (403)', async () => {
    const rRes = await fetch(`${baseUrl}/api/rutinas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`
      },
      body: JSON.stringify({
        nombre: 'Nombre Original',
        descripcion: 'Desc Original'
      })
    });
    const rutina = await rRes.json();

    // Intento de modificación por Usuario 2 -> 403
    const editRes2 = await fetch(`${baseUrl}/api/rutinas/${rutina.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser2}`
      },
      body: JSON.stringify({ nombre: 'Nombre Hackeado' })
    });
    assert.equal(editRes2.status, 403);

    // Modificación válida por Usuario 1 -> 200
    const editRes1 = await fetch(`${baseUrl}/api/rutinas/${rutina.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`
      },
      body: JSON.stringify({
        nombre: 'Nombre Editado',
        descripcion: 'Nueva descripción'
      })
    });
    assert.equal(editRes1.status, 200);
    const updated = await editRes1.json();
    assert.equal(updated.rutina.nombre, 'Nombre Editado');
  });

  await t.test('Debe permitir eliminar rutina al propietario y rechazar a terceros (403)', async () => {
    const rRes = await fetch(`${baseUrl}/api/rutinas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`
      },
      body: JSON.stringify({
        nombre: 'Para Borrar',
        descripcion: 'Se eliminará'
      })
    });
    const rutina = await rRes.json();

    // Usuario 2 intenta borrar -> 403
    const delRes2 = await fetch(`${baseUrl}/api/rutinas/${rutina.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenUser2}` }
    });
    assert.equal(delRes2.status, 403);

    // Usuario 1 borra -> 204
    const delRes1 = await fetch(`${baseUrl}/api/rutinas/${rutina.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenUser1}` }
    });
    assert.equal(delRes1.status, 204);

    // Comprobar que ya no existe -> 404
    const checkRes = await fetch(`${baseUrl}/api/rutinas/${rutina.id}`);
    assert.equal(checkRes.status, 404);
  });
});
