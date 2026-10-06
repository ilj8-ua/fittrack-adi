import test from 'node:test';
import assert from 'node:assert/strict';
import { setCustomClient } from '../src/supabaseClient.js';
import * as servicios from '../src/servicios.js';

// Cliente Mock enriquecido para pruebas unitarias de la capa de servicios
function createMockSupabase() {
  const store = {
    usuarios: [
      { id: 'u1', nombre: 'Iván L', email: 'ivan@test.com', bio: 'Atleta', fecha_registro: '2026-10-01' }
    ],
    rutinas: [
      { id: 1, usuario_id: 'u1', nombre: 'Fuerza 5x5', descripcion: 'Sentadilla y banca', nivel: 'intermedio', es_publica: true, fecha_creacion: '2026-10-02' },
      { id: 2, usuario_id: 'u1', nombre: 'Torso Hipertrofia', descripcion: 'Pecho y espalda', nivel: 'avanzado', es_publica: true, fecha_creacion: '2026-10-03' }
    ],
    ejercicios: [
      { id: 1, nombre: 'Press de banca plano', grupo_muscular: 'Pecho', equipamiento: 'Barra', creador_id: null }
    ],
    rutina_ejercicios: [
      { id: 10, rutina_id: 1, ejercicio_id: 1, series_objetivo: 5, repeticiones_objetivo: 5, orden: 1 }
    ]
  };

  const authSession = {
    session: { user: { id: 'u1', email: 'ivan@test.com' } }
  };

  return {
    store,
    auth: {
      async signUp({ email, password, options }) {
        const newUser = { id: `u_${Date.now()}`, email, user_metadata: options?.data };
        return { data: { user: newUser }, error: null };
      },
      async signInWithPassword({ email, password }) {
        if (password === 'badpassword') {
          return { data: { user: null, session: null }, error: new Error('Invalid login credentials') };
        }
        return { data: { user: { id: 'u1', email }, session: { access_token: 'fake-jwt-token' } }, error: null };
      },
      async signOut() {
        return { error: null };
      },
      async getSession() {
        return { data: authSession, error: null };
      }
    },
    from(tableName) {
      let filterCol = null;
      let filterVal = null;
      let insertedItem = null;
      let updatedItem = null;
      let rangeFrom = 0;
      let rangeTo = 100;
      let orderField = null;

      const queryObj = {
        select(cols, opts) {
          return queryObj;
        },
        eq(col, val) {
          filterCol = col;
          filterVal = val;
          return queryObj;
        },
        ilike(col, val) {
          return queryObj;
        },
        or(condition) {
          return queryObj;
        },
        order(field, opts) {
          orderField = field;
          return queryObj;
        },
        range(from, to) {
          rangeFrom = from;
          rangeTo = to;
          return queryObj;
        },
        insert(data) {
          insertedItem = { id: Date.now(), ...data };
          if (store[tableName]) {
            store[tableName].push(insertedItem);
          }
          return queryObj;
        },
        upsert(data) {
          if (store[tableName]) {
            const idx = store[tableName].findIndex(i => i.id === data.id);
            if (idx >= 0) store[tableName][idx] = { ...store[tableName][idx], ...data };
            else store[tableName].push(data);
          }
          return queryObj;
        },
        update(data) {
          updatedItem = data;
          return queryObj;
        },
        delete() {
          return queryObj;
        },
        single() {
          if (insertedItem) return Promise.resolve({ data: insertedItem, error: null });
          if (filterCol && filterVal) {
            const found = (store[tableName] || []).find(item => item[filterCol] == filterVal);
            if (updatedItem && found) {
              Object.assign(found, updatedItem);
              return Promise.resolve({ data: found, error: null });
            }
            if (found) return Promise.resolve({ data: found, error: null });
            return Promise.resolve({ data: null, error: new Error('Registro no encontrado') });
          }
          return Promise.resolve({ data: (store[tableName] || [])[0] || null, error: null });
        },
        then(resolve) {
          let list = [...(store[tableName] || [])];
          if (filterCol && filterVal) {
            list = list.filter(item => item[filterCol] == filterVal);
          }
          const sliced = list.slice(rangeFrom, rangeTo + 1);
          resolve({ data: sliced, error: null, count: list.length });
        }
      };

      return queryObj;
    }
  };
}

test('Iteración 05: Segundo Backend Supabase BaaS y Capa de Servicios', async (t) => {
  let mock;

  t.beforeEach(() => {
    mock = createMockSupabase();
    setCustomClient(mock);
  });

  await t.test('Servicio de Registro y Login', async () => {
    // Registro
    const user = await servicios.registro('nuevo@test.com', 'secreto123', 'Nuevo Atleta', 'Bio');
    assert.ok(user.id);
    assert.equal(user.email, 'nuevo@test.com');

    // Validación de password corto
    await assert.rejects(
      async () => servicios.registro('bad@test.com', '123', 'Nombre'),
      /al menos 6 caracteres/
    );

    // Login correcto
    const loginRes = await servicios.login('ivan@test.com', 'secreto123');
    assert.ok(loginRes.user);
    assert.ok(loginRes.session);

    // Login fallido
    await assert.rejects(
      async () => servicios.login('ivan@test.com', 'badpassword'),
      /Invalid login credentials/
    );

    // Logout
    const logoutRes = await servicios.logout();
    assert.equal(logoutRes, true);
  });

  await t.test('Servicios de Gestión de Perfil de Usuario', async () => {
    // Consulta perfil
    const perfil = await servicios.getPerfil('u1');
    assert.equal(perfil.id, 'u1');
    assert.equal(perfil.nombre, 'Iván L');

    // Edición perfil
    const actualizado = await servicios.updatePerfil('u1', { nombre: 'Iván Lafont Jabazin' });
    assert.equal(actualizado.nombre, 'Iván Lafont Jabazin');

    // Validación nombre corto
    await assert.rejects(
      async () => servicios.updatePerfil('u1', { nombre: 'a' }),
      /al menos 2 caracteres/
    );
  });

  await t.test('Servicios del Recurso Principal: Rutinas', async () => {
    // Creación válida
    const nueva = await servicios.crearRutina({
      nombre: 'Pierna Cuádriceps',
      descripcion: 'Sentadilla y prensa',
      nivel: 'avanzado',
      es_publica: true,
      usuario_id: 'u1'
    });
    assert.ok(nueva.id);
    assert.equal(nueva.nombre, 'Pierna Cuádriceps');
    assert.equal(nueva.nivel, 'avanzado');

    // Validación nombre corto
    await assert.rejects(
      async () => servicios.crearRutina({ nombre: 'ab', descripcion: 'desc', usuario_id: 'u1' }),
      /al menos 3 caracteres/
    );

    // Validación nivel inválido
    await assert.rejects(
      async () => servicios.crearRutina({ nombre: 'Nombre Válido', descripcion: 'desc', nivel: 'inexistente', usuario_id: 'u1' }),
      /Nivel inválido/
    );

    // Búsqueda paginada
    const listado = await servicios.buscarRutinas({ page: 1, limit: 10 });
    assert.ok(Array.isArray(listado.data));
    assert.ok(listado.paginacion);
    assert.equal(listado.paginacion.pagina, 1);
    assert.equal(listado.paginacion.limite, 10);

    // Detalle de rutina
    const detalle = await servicios.getRutinaConEjercicios(1);
    assert.equal(detalle.id, 1);
    assert.equal(detalle.nombre, 'Fuerza 5x5');

    // Actualización de rutina
    const mod = await servicios.updateRutina(1, { nombre: 'Fuerza 5x5 Modificada' });
    assert.equal(mod.nombre, 'Fuerza 5x5 Modificada');

    // Borrado de rutina
    const deleted = await servicios.borrarRutina(1);
    assert.equal(deleted, true);
  });

  await t.test('Servicios del Recurso Secundario: Ejercicios y Asignación', async () => {
    // Catálogo
    const catalogo = await servicios.getEjercicios();
    assert.ok(Array.isArray(catalogo));

    // Creación de ejercicio
    const nuevoEj = await servicios.crearEjercicio({
      nombre: 'Prensa inclinada',
      grupo_muscular: 'Piernas',
      equipamiento: 'Máquina'
    });
    assert.equal(nuevoEj.nombre, 'Prensa inclinada');

    // Asignación válida a rutina
    const asignacion = await servicios.addEjercicioARutina(1, 1, 4, 10, 2);
    assert.ok(asignacion.id);
    assert.equal(asignacion.series_objetivo, 4);
    assert.equal(asignacion.repeticiones_objetivo, 10);

    // Validación series no positivas
    await assert.rejects(
      async () => servicios.addEjercicioARutina(1, 1, 0, 10),
      /mayor que 0/
    );

    // Desasignación de ejercicio
    const borrado = await servicios.borrarEjercicioDeRutina(10);
    assert.equal(borrado, true);
  });
});
