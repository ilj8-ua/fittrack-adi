# Iteración 05 - Segundo Backend: Supabase BaaS (Capa de Servicios, Esquema RLS y Pruebas)

## SPEC

### Objetivo
Desarrollar el segundo backend del proyecto utilizando la plataforma Backend as a Service (BaaS) **Supabase**, cumpliendo el requisito adicional de la práctica (hasta 3 puntos adicionales). Este backend expone una capa de servicios en JavaScript que aísla al cliente del SDK de Supabase, define el esquema relacional en PostgreSQL con políticas Row Level Security (RLS) y cuenta con pruebas automatizadas completas.

### Requisitos Funcionales y Técnicos
- **Esquema de Base de Datos y RLS (`schema.sql`)**:
  - DDL de tablas `usuarios` (o perfil vinculado a `auth.users`), `ejercicios`, `rutinas` y `rutina_ejercicios`.
  - Activación de Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
  - Políticas de seguridad para lectura pública de rutinas (`es_publica = true`), lectura privada para propietarios, e inserción/modificación/borrado exclusivo para los creadores.
- **Capa de Servicios (`src/servicios.js`)**:
  - Funciones de autenticación:
    - `registro(email, password, nombre, bio)`
    - `login(email, password)`
    - `logout()`
    - `getUsuarioActual()`
    - `getPerfil(usuarioId)`
    - `updatePerfil(usuarioId, datos)`
  - Funciones del recurso principal (Rutinas):
    - `crearRutina(datos)`: valida campos e inserta en la tabla `rutinas`.
    - `buscarRutinas({ query, nivel, es_publica, page, limit, usuarioId })`: consulta paginada con filtros y cálculo de total de páginas.
    - `getRutinaConEjercicios(rutinaId)`: consulta de rutina con relación anidada de ejercicios.
    - `updateRutina(rutinaId, datos)`: valida y modifica la rutina.
    - `borrarRutina(rutinaId)`: elimina la rutina.
  - Funciones del recurso secundario:
    - `getEjercicios(grupoMuscular)`: consulta catálogo.
    - `addEjercicioARutina(rutinaId, ejercicioId, series, repeticiones, orden)`: valida objetivos numéricos y asocia ejercicio.
    - `borrarEjercicioDeRutina(rutinaEjercicioId)`: desasigna ejercicio.
- **Manejo de Errores y Validaciones**:
  - Validación de tipos y campos obligatorios antes de interactuar con el backend.
  - Conversión de errores de Supabase en excepciones claras y estructuradas.
- **Pruebas Automatizadas**:
  - Suite de tests en `backend-supabase/tests/servicios.test.js` ejecutables con `npm test`.

### Fuera de Alcance
- Frontend HTML/CSS (reservado para futuras prácticas).

## PLAN

1. Crear directorio `backend-supabase` con su `package.json`.
2. Instalar `@supabase/supabase-js`.
3. Crear `backend-supabase/schema.sql` con todas las definiciones de tablas, claves foráneas e instrucciones `CREATE POLICY` de RLS.
4. Crear `backend-supabase/src/config.js` y `backend-supabase/src/supabaseClient.js`.
5. Implementar `backend-supabase/src/servicios.js` con las funciones de capa de servicios.
6. Crear suite de pruebas automáticas en `backend-supabase/tests/servicios.test.js`.
7. Ejecutar pruebas con `npm test` en `backend-supabase` y verificar.

## TEST_PLAN

| Caso | Resultado Esperado | Resultado Obtenido |
|---|---|---|
| Registro y login de usuario mediante servicios | Devuelve objeto de usuario y sesión | Correcto |
| Validación de campos en `crearRutina` (nombre < 3 chars) | Lanza Error descriptivo de validación | Correcto |
| Creación válida de rutina con `crearRutina` | Devuelve el objeto de la rutina creada | Correcto |
| Búsqueda paginada en `buscarRutinas` | Devuelve `data` y metadatos de paginación (`total`, `total_paginas`, etc.) | Correcto |
| Consulta `getRutinaConEjercicios` | Devuelve la rutina junto con el array de ejercicios relacionados | Correcto |
| Validación de series/reps en `addEjercicioARutina` | Lanza Error si series o repeticiones <= 0 | Correcto |
| Asignación y borrado de ejercicio de rutina | Completa la operación y confirma el estado | Correcto |

### Tests automáticos
- `backend-supabase/tests/servicios.test.js`: cubre validaciones, llamadas a la capa de servicios, paginación, filtros y manejo de errores.

## AI_LOG

### Herramienta usada
- Herramienta: Antigravity
- Modelo: Gemini 3.7 Flash

### Uso realizado
- Redacción del script SQL completo con DDL y políticas de seguridad RLS de PostgreSQL.
- Implementación de la capa de servicios desacoplada para Supabase.
- Construcción de pruebas automatizadas completas.

## COMMITS RELACIONADOS

- `21a7161` - Iteración 05: Segundo Backend con Supabase BaaS, capa de servicios, esquema RLS y pruebas
