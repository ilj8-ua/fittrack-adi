-- ==========================================================
-- FITTRACK - ESQUEMA SUPABASE POSTGRESQL CON ROW LEVEL SECURITY (RLS)
-- Práctica 1 - ADI (Iván Lafont Jabazin - ilj8)
-- ==========================================================

-- 1. EXTENSIÓN PARA UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: perfiles (extiende la autenticación gestionada en auth.users)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    bio TEXT DEFAULT '',
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA: ejercicios (catálogo general y personalizados)
CREATE TABLE IF NOT EXISTS public.ejercicios (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    grupo_muscular TEXT NOT NULL,
    equipamiento TEXT NOT NULL,
    creador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA: rutinas (recurso principal)
CREATE TABLE IF NOT EXISTS public.rutinas (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    nivel TEXT NOT NULL DEFAULT 'intermedio' CHECK (nivel IN ('principiante', 'intermedio', 'avanzado')),
    es_publica BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLA: rutina_ejercicios (recurso secundario / relación intermedia)
CREATE TABLE IF NOT EXISTS public.rutina_ejercicios (
    id BIGSERIAL PRIMARY KEY,
    rutina_id BIGINT NOT NULL REFERENCES public.rutinas(id) ON DELETE CASCADE,
    ejercicio_id BIGINT NOT NULL REFERENCES public.ejercicios(id) ON DELETE CASCADE,
    series_objetivo INTEGER NOT NULL CHECK (series_objetivo > 0),
    repeticiones_objetivo INTEGER NOT NULL CHECK (repeticiones_objetivo > 0),
    orden INTEGER NOT NULL DEFAULT 1
);

-- ==========================================================
-- ACTIVACIÓN DE ROW LEVEL SECURITY (RLS)
-- ==========================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rutinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rutina_ejercicios ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- POLÍTICAS DE SEGURIDAD (RLS POLICIES)
-- ==========================================================

-- --- POLÍTICAS PARA: usuarios ---
-- Cualquiera puede ver perfiles públicos
CREATE POLICY "Lectura pública de perfiles"
ON public.usuarios FOR SELECT
TO public
USING (true);

-- Solo el propio usuario autenticado puede actualizar su perfil
CREATE POLICY "Actualizar perfil propio"
ON public.usuarios FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- --- POLÍTICAS PARA: ejercicios ---
-- Lectura pública del catálogo de ejercicios
CREATE POLICY "Lectura pública de ejercicios"
ON public.ejercicios FOR SELECT
TO public
USING (true);

-- Inserción de nuevos ejercicios para usuarios autenticados
CREATE POLICY "Crear ejercicios autenticados"
ON public.ejercicios FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creador_id OR creador_id IS NULL);

-- --- POLÍTICAS PARA: rutinas ---
-- Lectura de rutinas públicas o propias del usuario autenticado
CREATE POLICY "Lectura de rutinas publicas o propias"
ON public.rutinas FOR SELECT
TO public
USING (
    es_publica = true OR (auth.uid() IS NOT NULL AND auth.uid() = usuario_id)
);

-- Inserción de rutinas asociadas al usuario autenticado
CREATE POLICY "Crear rutinas propias"
ON public.rutinas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

-- Modificación exclusiva por el propietario de la rutina
CREATE POLICY "Actualizar rutinas propias"
ON public.rutinas FOR UPDATE
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- Borrado exclusivo por el propietario de la rutina
CREATE POLICY "Borrar rutinas propias"
ON public.rutinas FOR DELETE
TO authenticated
USING (auth.uid() = usuario_id);

-- --- POLÍTICAS PARA: rutina_ejercicios ---
-- Lectura de ejercicios asignados si la rutina correspondiente es visible
CREATE POLICY "Lectura de ejercicios en rutinas visibles"
ON public.rutina_ejercicios FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM public.rutinas r
        WHERE r.id = rutina_id
        AND (r.es_publica = true OR (auth.uid() IS NOT NULL AND auth.uid() = r.usuario_id))
    )
);

-- Inserción y eliminación de ejercicios en rutina solo por el dueño de la rutina
CREATE POLICY "Gestionar ejercicios en rutinas propias"
ON public.rutina_ejercicios FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.rutinas r
        WHERE r.id = rutina_id
        AND auth.uid() = r.usuario_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.rutinas r
        WHERE r.id = rutina_id
        AND auth.uid() = r.usuario_id
    )
);

-- ==========================================================
-- DATOS SEMILLA INICIALES (Catálogo de ejercicios)
-- ==========================================================
INSERT INTO public.ejercicios (nombre, grupo_muscular, equipamiento, creador_id) VALUES
('Press de banca plano', 'Pecho', 'Barra y banco plano', NULL),
('Sentadilla trasera', 'Piernas', 'Barra y rack', NULL),
('Peso muerto convencional', 'Espalda / Piernas', 'Barra', NULL),
('Press militar de pie', 'Hombros', 'Barra', NULL),
('Dominadas pronas', 'Espalda', 'Barra de dominadas', NULL),
('Fondos en paralelas', 'Pecho / Tríceps', 'Barras paralelas', NULL),
('Curl de bíceps con mancuernas', 'Bíceps', 'Mancuernas', NULL),
('Elevaciones laterales', 'Hombros', 'Mancuernas', NULL)
ON CONFLICT DO NOTHING;
