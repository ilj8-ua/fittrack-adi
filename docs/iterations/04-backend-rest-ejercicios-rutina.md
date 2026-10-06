# Iteración 04 - Backend REST: Recurso Secundario (Ejercicios y Asignaciones a Rutina)

## SPEC

### Objetivo
Implementar las operaciones de gestión para el recurso secundario (**Ejercicios** y su relación intermedia **Rutina-Ejercicios**), incluyendo listado, creación, asignación a rutinas con validación de objetivos numéricos y desasignación/borrado bajo estricto control de permisos.

### Requisitos Funcionales
- **Catálogo de Ejercicios (`GET /api/ejercicios` y `POST /api/ejercicios`)**:
  - `GET /api/ejercicios`: Permite listar todos los ejercicios del catálogo, con soporte de filtrado opcional por `grupo_muscular` (ej. 'Pecho', 'Piernas').
  - `POST /api/ejercicios`: Permite a un usuario autenticado añadir un nuevo ejercicio al catálogo (`nombre`, `grupo_muscular`, `equipamiento`), validando que los campos no estén vacíos.
- **Listar Ejercicios de una Rutina (`GET /api/rutinas/:id/ejercicios`)**:
  - Devuelve todos los ejercicios asociados a la rutina con sus atributos (`id_rutina_ejercicio`, `nombre`, `grupo_muscular`, `equipamiento`, `series_objetivo`, `repeticiones_objetivo`, `orden`).
  - Aplica reglas de visibilidad (rutinas públicas visibles para todos; rutinas privadas solo para su creador).
- **Asignar Ejercicio a Rutina (`POST /api/rutinas/:id/ejercicios`)**:
  - Requiere autenticación JWT.
  - Restricción de acceso: Únicamente el usuario creador de la rutina puede añadirle ejercicios (403 Forbidden).
  - Parámetros requeridos: `ejercicio_id`, `series_objetivo` (entero > 0), `repeticiones_objetivo` (entero > 0), `orden` (opcional).
  - Validaciones: Verifica que el `ejercicio_id` exista en la base de datos y que las series y repeticiones sean números enteros estrictamente positivos (> 0).
  - Responde con 201 Created y el detalle del elemento asignado.
- **Desasignar/Eliminar Ejercicio de Rutina (`DELETE /api/rutinas/:id/ejercicios/:id_ejercicio_rutina`)**:
  - Requiere autenticación JWT.
  - Restricción de acceso: Únicamente el usuario creador de la rutina puede eliminar ejercicios de ella (403 Forbidden).
  - Responde con 204 No Content.

### Requisitos Técnicos
- Módulo `src/routes/ejercicios.js` para el catálogo global.
- Extensiones de rutas en `src/routes/rutinas.js` para la sub-colección `/api/rutinas/:id/ejercicios`.
- Validación estricta de tipos numéricos y claves foráneas en SQLite.

### Fuera de Alcance
- Capa de servicios y configuración en Supabase BaaS (Iteración 05).

## PLAN

1. Crear `src/routes/ejercicios.js` con endpoints `GET /` y `POST /`.
2. Añadir en `src/routes/rutinas.js` los endpoints de la sub-colección:
   - `GET /:id/ejercicios`
   - `POST /:id/ejercicios`
   - `DELETE /:id/ejercicios/:id_ejercicio_rutina`
3. Registrar `ejerciciosRouter` en `src/app.js` bajo `/api/ejercicios`.
4. Escribir suite de pruebas automáticas en `backend-rest/tests/ejercicios_rutina.test.js`.
5. Ejecutar tests con `npm test` y verificar todos los casos.

## TEST_PLAN

| Caso | Resultado Esperado | Resultado Obtenido |
|---|---|---|
| Listar catálogo de ejercicios | 200 OK con lista de ejercicios iniciales | Correcto |
| Filtrar catálogo por grupo muscular `?grupo_muscular=Piernas` | 200 OK devolviendo solo ejercicios de piernas | Correcto |
| Crear nuevo ejercicio en catálogo (autenticado) | 201 Created con el ejercicio registrado | Correcto |
| Listar ejercicios de una rutina pública | 200 OK con array de ejercicios asignados | Correcto |
| Asignar ejercicio a rutina propia con series/reps válidas | 201 Created con objeto asignado | Correcto |
| Asignar ejercicio con series <= 0 | 400 Bad Request | Correcto |
| Asignar ejercicio inexistente (`ejercicio_id: 9999`) | 404 Not Found | Correcto |
| Asignar ejercicio a rutina ajena | 403 Forbidden | Correcto |
| Eliminar ejercicio de rutina propia | 204 No Content | Correcto |
| Eliminar ejercicio de rutina ajena | 403 Forbidden | Correcto |

### Tests automáticos
- `backend-rest/tests/ejercicios_rutina.test.js`: cubre todos los casos de prueba descritos.

## AI_LOG

### Herramienta usada
- Herramienta: Antigravity
- Modelo: Gemini 3.7 Flash

### Uso realizado
- Implementación de sub-recursos REST jerárquicos (`/rutinas/:id/ejercicios`).
- Verificación cruzada de pertenencia y restricciones de integridad en SQLite.
- Generación de pruebas de integración exhaustivas.

## COMMITS RELACIONADOS

- Pendiente de asignación tras el commit de la iteración.
