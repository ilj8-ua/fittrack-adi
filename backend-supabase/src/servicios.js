import { getSupabaseClient } from './supabaseClient.js';

/**
 * ==========================================================
 * CAPA DE SERVICIOS - FITTRACK (SUPABASE BAAS)
-- Aísla completamente al cliente del SDK de Supabase
 * ==========================================================
 */

// ----------------------------------------------------------
// 1. SERVICIOS DE AUTENTICACIÓN Y USUARIOS
// ----------------------------------------------------------

/**
 * Registra un nuevo usuario en Supabase Auth y crea su perfil público
 */
export async function registro(email, password, nombre, bio = '') {
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new Error('Debe proporcionar un email válido.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
    throw new Error('El nombre es obligatorio y debe tener al menos 2 caracteres.');
  }

  const supabase = getSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { nombre: nombre.trim(), bio: bio.trim() }
    }
  });

  if (authError) throw authError;

  // Insertar en tabla pública de usuarios/perfiles si existe
  if (authData?.user) {
    const { error: profileError } = await supabase
      .from('usuarios')
      .upsert({
        id: authData.user.id,
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        bio: bio.trim()
      });
    if (profileError) throw profileError;
  }

  return authData.user;
}

/**
 * Inicia sesión con email y contraseña
 */
export async function login(email, password) {
  if (!email || !password) {
    throw new Error('Debe ingresar email y contraseña.');
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });

  if (error) throw error;
  return { user: data.user, session: data.session };
}

/**
 * Cierra la sesión activa
 */
export async function logout() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

/**
 * Obtiene el usuario autenticado actualmente
 */
export async function getUsuarioActual() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session ? data.session.user : null;
}

/**
 * Obtiene el perfil de un usuario dado su UUID
 */
export async function getPerfil(usuarioId) {
  if (!usuarioId) throw new Error('Debe especificar el id del usuario.');

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, email, bio, fecha_registro')
    .eq('id', usuarioId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Actualiza el perfil de un usuario
 */
export async function updatePerfil(usuarioId, { nombre, bio }) {
  if (!usuarioId) throw new Error('Debe especificar el id del usuario.');

  const updates = {};
  if (nombre !== undefined) {
    if (typeof nombre !== 'string' || nombre.trim().length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres.');
    }
    updates.nombre = nombre.trim();
  }

  if (bio !== undefined) {
    if (typeof bio !== 'string') {
      throw new Error('La biografía debe ser un texto.');
    }
    updates.bio = bio.trim();
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('usuarios')
    .update(updates)
    .eq('id', usuarioId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ----------------------------------------------------------
// 2. SERVICIOS DEL RECURSO PRINCIPAL (RUTINAS)
// ----------------------------------------------------------

/**
 * Crea una nueva rutina
 */
export async function crearRutina({ nombre, descripcion, nivel = 'intermedio', es_publica = true, usuario_id }) {
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 3) {
    throw new Error('El nombre de la rutina debe tener al menos 3 caracteres.');
  }

  if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0) {
    throw new Error('La descripción de la rutina es obligatoria.');
  }

  const nivelesValidos = ['principiante', 'intermedio', 'avanzado'];
  const nivelNormalizado = nivel ? String(nivel).toLowerCase() : 'intermedio';
  if (!nivelesValidos.includes(nivelNormalizado)) {
    throw new Error('Nivel inválido. Debe ser principiante, intermedio o avanzado.');
  }

  const supabase = getSupabaseClient();

  // Si no se especifica usuario_id, tomar el de la sesión actual
  let uid = usuario_id;
  if (!uid) {
    const { data: sessionData } = await supabase.auth.getSession();
    uid = sessionData?.session?.user?.id;
  }

  if (!uid) {
    throw new Error('Debes estar autenticado para crear una rutina.');
  }

  const { data, error } = await supabase
    .from('rutinas')
    .insert({
      usuario_id: uid,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      nivel: nivelNormalizado,
      es_publica: Boolean(es_publica)
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Busca y lista rutinas con paginación y filtros
 */
export async function buscarRutinas({
  query = '',
  nivel = null,
  es_publica = null,
  usuario_id = null,
  page = 1,
  limit = 10
} = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (p - 1) * l;

  const supabase = getSupabaseClient();
  let builder = supabase
    .from('rutinas')
    .select('*, creador:usuarios(id, nombre)', { count: 'exact' });

  if (query && typeof query === 'string' && query.trim() !== '') {
    builder = builder.or(`nombre.ilike.%${query.trim()}%,descripcion.ilike.%${query.trim()}%`);
  }

  if (nivel && typeof nivel === 'string') {
    builder = builder.eq('nivel', nivel.toLowerCase());
  }

  if (es_publica !== null && es_publica !== undefined) {
    builder = builder.eq('es_publica', Boolean(es_publica));
  }

  if (usuario_id) {
    builder = builder.eq('usuario_id', usuario_id);
  }

  builder = builder
    .order('fecha_creacion', { ascending: false })
    .range(offset, offset + l - 1);

  const { data, error, count } = await builder;
  if (error) throw error;

  const total = count || (data ? data.length : 0);
  const total_paginas = Math.ceil(total / l) || 1;

  return {
    data: data || [],
    paginacion: {
      total,
      pagina: p,
      limite: l,
      total_paginas
    }
  };
}

/**
 * Obtiene el detalle de una rutina junto con sus ejercicios asignados
 */
export async function getRutinaConEjercicios(rutinaId) {
  if (!rutinaId) throw new Error('Debe proporcionar el id de la rutina.');

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('rutinas')
    .select(`
      id,
      nombre,
      descripcion,
      nivel,
      es_publica,
      fecha_creacion,
      usuario_id,
      creador:usuarios(id, nombre, email),
      ejercicios:rutina_ejercicios(
        id,
        series_objetivo,
        repeticiones_objetivo,
        orden,
        ejercicio:ejercicios(
          id,
          nombre,
          grupo_muscular,
          equipamiento
        )
      )
    `)
    .eq('id', rutinaId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Modifica una rutina existente
 */
export async function updateRutina(rutinaId, { nombre, descripcion, nivel, es_publica }) {
  if (!rutinaId) throw new Error('Debe proporcionar el id de la rutina.');

  const updates = {};
  if (nombre !== undefined) {
    if (typeof nombre !== 'string' || nombre.trim().length < 3) {
      throw new Error('El nombre de la rutina debe tener al menos 3 caracteres.');
    }
    updates.nombre = nombre.trim();
  }

  if (descripcion !== undefined) {
    if (typeof descripcion !== 'string' || descripcion.trim().length === 0) {
      throw new Error('La descripción no puede estar vacía.');
    }
    updates.descripcion = descripcion.trim();
  }

  if (nivel !== undefined) {
    const nivelesValidos = ['principiante', 'intermedio', 'avanzado'];
    if (!nivelesValidos.includes(String(nivel).toLowerCase())) {
      throw new Error('El nivel debe ser principiante, intermedio o avanzado.');
    }
    updates.nivel = String(nivel).toLowerCase();
  }

  if (es_publica !== undefined) {
    updates.es_publica = Boolean(es_publica);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('rutinas')
    .update(updates)
    .eq('id', rutinaId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Elimina una rutina por su id
 */
export async function borrarRutina(rutinaId) {
  if (!rutinaId) throw new Error('Debe proporcionar el id de la rutina.');

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('rutinas')
    .delete()
    .eq('id', rutinaId);

  if (error) throw error;
  return true;
}

// ----------------------------------------------------------
// 3. SERVICIOS DEL RECURSO SECUNDARIO (EJERCICIOS)
// ----------------------------------------------------------

/**
 * Consulta catálogo de ejercicios
 */
export async function getEjercicios(grupoMuscular = null) {
  const supabase = getSupabaseClient();
  let builder = supabase.from('ejercicios').select('*');

  if (grupoMuscular && typeof grupoMuscular === 'string' && grupoMuscular.trim() !== '') {
    builder = builder.ilike('grupo_muscular', `%${grupoMuscular.trim()}%`);
  }

  const { data, error } = await builder.order('nombre', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Añade un ejercicio al catálogo
 */
export async function crearEjercicio({ nombre, grupo_muscular, equipamiento, creador_id = null }) {
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
    throw new Error('El nombre del ejercicio debe tener al menos 2 caracteres.');
  }

  if (!grupo_muscular || typeof grupo_muscular !== 'string') {
    throw new Error('El grupo muscular es obligatorio.');
  }

  if (!equipamiento || typeof equipamiento !== 'string') {
    throw new Error('El equipamiento es obligatorio.');
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('ejercicios')
    .insert({
      nombre: nombre.trim(),
      grupo_muscular: grupo_muscular.trim(),
      equipamiento: equipamiento.trim(),
      creador_id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Asigna un ejercicio a una rutina
 */
export async function addEjercicioARutina(rutinaId, ejercicioId, series_objetivo, repeticiones_objetivo, orden = 1) {
  if (!rutinaId || !ejercicioId) {
    throw new Error('Debe especificar rutinaId y ejercicioId.');
  }

  const series = parseInt(series_objetivo, 10);
  const reps = parseInt(repeticiones_objetivo, 10);

  if (isNaN(series) || series <= 0) {
    throw new Error('Las series objetivo deben ser un número entero mayor que 0.');
  }

  if (isNaN(reps) || reps <= 0) {
    throw new Error('Las repeticiones objetivo deben ser un número entero mayor que 0.');
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('rutina_ejercicios')
    .insert({
      rutina_id: rutinaId,
      ejercicio_id: ejercicioId,
      series_objetivo: series,
      repeticiones_objetivo: reps,
      orden: parseInt(orden, 10) || 1
    })
    .select(`
      id,
      rutina_id,
      ejercicio_id,
      series_objetivo,
      repeticiones_objetivo,
      orden,
      ejercicio:ejercicios(nombre, grupo_muscular, equipamiento)
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Elimina un ejercicio asignado a una rutina
 */
export async function borrarEjercicioDeRutina(rutinaEjercicioId) {
  if (!rutinaEjercicioId) {
    throw new Error('Debe especificar el identificador de asignación.');
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('rutina_ejercicios')
    .delete()
    .eq('id', rutinaEjercicioId);

  if (error) throw error;
  return true;
}
