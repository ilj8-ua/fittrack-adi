// Solo este archivo conoce el SDK y la tabla de Supabase.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Las funciones devuelven datos normales o lanzan un error.
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function logout() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function getUsuarioActual() {
  if (SUPABASE_KEY === 'TU_PUBLISHABLE_KEY') {
    throw new Error('Completa la URL y la clave pública en config.js y recarga la página.');
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session ? data.session.user : null;
}

export async function getLista(usuario) {
  const { data, error } = await supabase
    .from('lista')
    .select('id, nombre, comprado')
    .eq('usuario', usuario)
    .order('id');

  if (error) throw error;
  return data;
}

// item es el nombre del producto; usuario es el UUID del usuario.
export async function addToLista(item, usuario) {
  const nombre = item.trim();
  if (!nombre) throw new Error('Escribe el nombre del producto.');

  const { error } = await supabase
    .from('lista')
    .insert({ nombre, comprado: false, usuario });

  if (error) throw error;
}

export async function setComprado(id, comprado, usuario) {
  const { error } = await supabase
    .from('lista')
    .update({ comprado })
    .eq('id', id)
    .eq('usuario', usuario)
    .select('id')
    .single();

  if (error) throw error;
}

export async function borrarDeLista(id, usuario) {
  const { error } = await supabase
    .from('lista')
    .delete()
    .eq('id', id)
    .eq('usuario', usuario)
    .select('id')
    .single();

  if (error) throw error;
}
