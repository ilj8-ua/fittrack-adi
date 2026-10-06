# Iteración 03 - Backend REST: CRUD de Rutinas (Recurso Principal), Paginación y Filtros

## SPEC

### Objetivo
Implementar todas las operaciones CRUD sobre el recurso principal del sistema (**Rutinas**), incluyendo paginación, filtros de búsqueda, consulta de detalle con recurso secundario relacionado y control de acceso basado en roles y propiedad.

### Requisitos Funcionales
- **Crear Rutina (`POST /api/rutinas`)**:
  - Requiere autenticación JWT.
  - Recibe objeto JSON con `nombre`, `descripcion`, `nivel` (opcional: 'principiante', 'intermedio', 'avanzado') y `es_publica` (booleano).
  - Valida que `nombre` tenga al menos 3 caracteres y `descripcion` no esté vacía.
  - Asigna automáticamente `usuario_id` del usuario autenticado.
  - Responde con 201 Created, cabecera `Location` y el objeto de la rutina creada.
- **Listar y Buscar Rutinas con Paginación (`GET /api/rutinas`)**:
  - Parámetros de consulta (`query params`):
    - `page` (número de página, por defecto 1).
    - `limit` (elementos por página, por defecto 10).
    - `q` (búsqueda por coincidencia de texto en nombre o descripción).
    - `nivel` (filtro por nivel de dificultad).
    - `es_publica` (filtro por visibilidad).
  - Control de visibilidad:
    - Usuarios no autenticados o generales solo ven rutinas públicas (`es_publica = 1`).
    - Usuarios autenticados ven rutinas públicas más sus propias rutinas privadas (`usuario_id = req.usuario.id`).
  - Responde con array `data` y metadatos de paginación (`total`, `pagina`, `limite`, `total_paginas`).
- **Detalle de Rutina con Ejercicios Anidados (`GET /api/rutinas/:id`)**:
  - Devuelve la información completa de la rutina junto con los datos de su creador y la lista de ejercicios asignados (`recurso secundario`).
  - Si la rutina es privada y el usuario que consulta no es el creador, responde con 403 Forbidden.
  - Si la rutina no existe, responde con 404 Not Found.
- **Modificar Rutina (`PUT /api/rutinas/:id`)**:
  - Requiere autenticación JWT.
  - Solo el usuario creador/propietario puede modificarla (403 Forbidden si no es el creador).
  - Valida los campos a actualizar y devuelve 200 OK con la rutina actualizada.
- **Eliminar Rutina (`DELETE /api/rutinas/:id`)**:
  - Requiere autenticación JWT.
  - Solo el creador puede eliminarla (403 Forbidden si no es el creador).
  - Responde con 204 No Content.

### Requisitos Técnicos
- Módulo de rutas `src/routes/rutinas.js`.
- Integración del middleware de autenticación (`authenticateToken` y `optionalAuth`).
- Consultas SQL optimizadas en SQLite con conteo `COUNT(*)` y cláusulas `LIMIT ... OFFSET ...`.

### Fuera de Alcance
- Gestión detallada de adición/borrado individual de ejercicios en rutinas (Iteración 04).

## PLAN

1. Crear `src/routes/rutinas.js`.
2. Implementar `POST /` con validación y asignación de creador.
3. Implementar `GET /` con soporte de `page`, `limit`, `q`, `nivel` y cálculo de metadatos de paginación.
4. Implementar `GET /:id` realizando JOIN con `rutina_ejercicios` y `ejercicios` para devolver el recurso secundario anidado.
5. Implementar `PUT /:id` con comprobación de propiedad y validación.
6. Implementar `DELETE /:id` con comprobación de propiedad y borrado en cascada.
7. Montar `rutinasRouter` en `src/app.js` bajo `/api/rutinas`.
8. Escribir pruebas automatizadas exhaustivas en `backend-rest/tests/rutinas.test.js`.
9. Ejecutar pruebas con `npm test` y verificar.

## TEST_PLAN

| Caso | Resultado Esperado | Resultado Obtenido |
|---|---|---|
| Crear rutina autenticado con datos válidos | 201 Created con cabecera Location y datos completos | Correcto |
| Crear rutina sin token | 401 Unauthorized | Correcto |
| Crear rutina con nombre inválido (<3 chars) | 400 Bad Request | Correcto |
| Listado paginado (página 1, límite 2) | 200 OK con metadatos de paginación correctos | Correcto |
| Búsqueda por palabra clave `?q=Pecho` | 200 OK devolviendo solo rutinas coincidentes | Correcto |
| Ver detalle de rutina pública con ejercicios | 200 OK con array de ejercicios asignados | Correcto |
| Ver detalle de rutina privada ajena | 403 Forbidden | Correcto |
| Modificar rutina propia | 200 OK con datos modificados | Correcto |
| Modificar rutina ajena | 403 Forbidden | Correcto |
| Eliminar rutina propia | 204 No Content y desaparece en posteriores consultas | Correcto |
| Eliminar rutina ajena | 403 Forbidden | Correcto |

### Tests automáticos
- `backend-rest/tests/rutinas.test.js`: cubre creación, paginación, filtros de búsqueda, permisos de modificación/borrado y detalle con ejercicios.

## AI_LOG

### Herramienta usada
- Herramienta: Antigravity
- Modelo: Gemini 3.7 Flash

### Uso realizado
- Implementación de lógica de paginación y búsqueda multi-criterio en SQL.
- Implementación del endpoint de detalle con anidación del recurso secundario.
- Verificación estricta de permisos de propiedad.

## COMMITS RELACIONADOS

- Pendiente de asignación tras el commit de la iteración.
