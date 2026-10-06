import test from 'node:test';
import assert from 'node:assert/strict';
import { initDB, closeDB } from '../src/db/database.js';
import { createApp } from '../src/app.js';

test('Iteración 02: Autenticación y Gestión de Usuarios (JWT)', async (t) => {
  let server;
  let baseUrl;
  let db;

  t.beforeEach(() => {
    db = initDB(':memory:');
    const app = createApp(db);
    server = app.listen(0);
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  t.afterEach(() => {
    server.close();
    closeDB();
  });

  await t.test('Debe registrar un nuevo usuario con éxito', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Iván Lafont',
        email: 'ivan@ua.es',
        password: 'password123',
        bio: 'Atleta y desarrollador'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.token, 'Debe devolver un token JWT');
    assert.equal(data.usuario.nombre, 'Iván Lafont');
    assert.equal(data.usuario.email, 'ivan@ua.es');
    assert.equal(data.usuario.bio, 'Atleta y desarrollador');
    assert.equal(data.usuario.password_hash, undefined, 'No debe exponer el password_hash');
    assert.equal(data.usuario.salt, undefined, 'No debe exponer el salt');
  });

  await t.test('Debe rechazar el registro con email duplicado (409 Conflict)', async () => {
    // Primer registro
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Iván',
        email: 'duplicado@ua.es',
        password: 'password123'
      })
    });

    // Segundo registro con mismo email
    const res2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Otro Iván',
        email: 'duplicado@ua.es',
        password: 'password456'
      })
    });

    assert.equal(res2.status, 409);
    const data = await res2.json();
    assert.match(data.error, /Ya existe un usuario/i);
  });

  await t.test('Debe validar contraseña corta y formato de email en el registro (400)', async () => {
    const res1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Carlos',
        email: 'invalido',
        password: '123'
      })
    });
    assert.equal(res1.status, 400);

    const res2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: '',
        email: 'carlos@ua.es',
        password: 'passwordValido123'
      })
    });
    assert.equal(res2.status, 400);
  });

  await t.test('Debe autenticar un usuario correctamente con login (200 OK)', async () => {
    // Registrar usuario
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Lucía',
        email: 'lucia@ua.es',
        password: 'luciaPassword123'
      })
    });

    // Login correcto
    const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'lucia@ua.es',
        password: 'luciaPassword123'
      })
    });

    assert.equal(resLogin.status, 200);
    const data = await resLogin.json();
    assert.ok(data.token, 'Debe retornar un token JWT');
    assert.equal(data.usuario.email, 'lucia@ua.es');
  });

  await t.test('Debe denegar login con contraseña incorrecta (401 Unauthorized)', async () => {
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Marcos',
        email: 'marcos@ua.es',
        password: 'marcosPassword123'
      })
    });

    const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'marcos@ua.es',
        password: 'passwordErroneo'
      })
    });

    assert.equal(resLogin.status, 401);
    const data = await resLogin.json();
    assert.match(data.error, /Credenciales inválidas/i);
  });

  await t.test('Debe permitir ver perfil de un usuario existente (GET /api/usuarios/:id)', async () => {
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Elena',
        email: 'elena@ua.es',
        password: 'password123',
        bio: 'Powerlifter'
      })
    });
    const { usuario } = await regRes.json();

    const getRes = await fetch(`${baseUrl}/api/usuarios/${usuario.id}`);
    assert.equal(getRes.status, 200);
    const data = await getRes.json();
    assert.equal(data.id, usuario.id);
    assert.equal(data.nombre, 'Elena');
    assert.equal(data.bio, 'Powerlifter');
    assert.equal(data.password_hash, undefined);
  });

  await t.test('Debe permitir modificar únicamente el perfil propio (PUT /api/usuarios/:id)', async () => {
    // Usuario 1
    const regRes1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Usuario Uno',
        email: 'user1@ua.es',
        password: 'password123'
      })
    });
    const { token: token1, usuario: user1 } = await regRes1.json();

    // Usuario 2
    const regRes2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Usuario Dos',
        email: 'user2@ua.es',
        password: 'password123'
      })
    });
    const { token: token2, usuario: user2 } = await regRes2.json();

    // Caso 1: Modificación autorizada de perfil propio
    const updateRes = await fetch(`${baseUrl}/api/usuarios/${user1.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        nombre: 'Usuario Uno Actualizado',
        bio: 'Nueva biografía de atleta'
      })
    });
    assert.equal(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.equal(updateData.usuario.nombre, 'Usuario Uno Actualizado');
    assert.equal(updateData.usuario.bio, 'Nueva biografía de atleta');

    // Caso 2: Intento de modificar perfil ajeno (Token 2 intentando editar Usuario 1 -> 403 Forbidden)
    const attackRes = await fetch(`${baseUrl}/api/usuarios/${user1.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`
      },
      body: JSON.stringify({
        nombre: 'Nombre Hackeado'
      })
    });
    assert.equal(attackRes.status, 403);
    const attackData = await attackRes.json();
    assert.match(attackData.error, /No tienes permiso/i);

    // Caso 3: Modificación sin token -> 401 Unauthorized
    const unauthRes = await fetch(`${baseUrl}/api/usuarios/${user1.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Sin Auth' })
    });
    assert.equal(unauthRes.status, 401);
  });
});
