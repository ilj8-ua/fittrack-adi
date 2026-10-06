# Iteración 02 - Backend REST: Autenticación y Gestión de Usuarios (JWT)

## SPEC

### Objetivo
Implementar el sistema completo de autenticación y gestión de perfiles de usuario en el Backend REST utilizando tokens JWT y hashing criptográfico de contraseñas.

### Requisitos Funcionales
- **Registro (`POST /api/auth/register`)**:
  - Permite a un nuevo usuario darse de alta proporcionando `nombre`, `email`, `password` y opcionalmente `bio`.
  - Validación de campos: `email` con formato válido, `password` de al menos 6 caracteres, `nombre` no vacío.
  - Comprobación de unicidad de `email` (código HTTP 409 Conflict si ya existe).
  - Almacena la contraseña cifrada con Salt único mediante HMAC-SHA256 / SHA-256.
  - Retorna estado 201 Created con el token JWT y los datos públicos del usuario.
- **Login (`POST /api/auth/login`)**:
  - Permite iniciar sesión con `email` y `password`.
  - Comprueba credenciales; si no coinciden o el usuario no existe, responde con 401 Unauthorized.
  - Retorna estado 200 OK con el token JWT generado y datos del usuario.
- **Consulta de Perfil (`GET /api/usuarios/:id`)**:
  - Permite consultar los datos públicos de un usuario (`id`, `nombre`, `email`, `bio`, `fecha_registro`).
  - Responde con 404 Not Found si el usuario no existe.
- **Edición de Perfil (`PUT /api/usuarios/:id`)**:
  - Requiere autenticación JWT en cabecera `Authorization: Bearer <token>`.
  - Restricción de acceso estricta: un usuario únicamente puede editar su propio perfil (`req.usuario.id === req.params.id`), respondiendo 403 Forbidden si intenta editar el perfil de otro usuario.
  - Permite actualizar `nombre` y `bio`.
  - Valida los nuevos valores y responde con 200 OK y el perfil actualizado.

### Requisitos Técnicos
- Módulo de seguridad `src/utils/security.js` para hashing de contraseñas y generación/verificación de tokens JWT estándar (formato base64url con cabecera, payload y firma criptográfica SHA-256).
- Middleware `src/middleware/auth.js` (`authenticateToken` y `optionalAuth`).
- Rutas organizadas en `src/routes/auth.js` y `src/routes/usuarios.js`.

### Fuera de Alcance
- CRUD de rutinas y ejercicios (Iteraciones 03 y 04).

## PLAN

1. Crear `src/utils/security.js` con funciones para:
   - `hashPassword(password)` / `verifyPassword(password, hash, salt)`
   - `generateJWT(payload)`
   - `verifyJWT(token)`
2. Crear `src/middleware/auth.js` con:
   - `authenticateToken`: valida cabecera `Authorization: Bearer <token>` e inyecta `req.usuario`.
   - `optionalAuth`: extrae el usuario si se proporciona token válido, sin bloquear si es anónimo.
3. Crear `src/routes/auth.js` implementando `/register` y `/login`.
4. Crear `src/routes/usuarios.js` implementando `GET /:id` y `PUT /:id`.
5. Registrar las rutas en `src/app.js` bajo `/api/auth` y `/api/usuarios`.
6. Crear suite de pruebas automáticas en `tests/auth_usuarios.test.js`.
7. Ejecutar pruebas con `npm test` y verificar todos los casos de prueba.

## TEST_PLAN

| Caso | Resultado Esperado | Resultado Obtenido |
|---|---|---|
| Registro exitoso con datos válidos | 201 Created con token JWT y datos de usuario | Correcto |
| Registro con email duplicado | 409 Conflict con mensaje descriptivo | Correcto |
| Registro con contraseña corta (<6 chars) | 400 Bad Request | Correcto |
| Login con credenciales correctas | 200 OK con token JWT válido | Correcto |
| Login con contraseña incorrecta | 401 Unauthorized | Correcto |
| Consulta de perfil existente | 200 OK con datos públicos (sin hash ni salt) | Correcto |
| Consulta de perfil inexistente | 404 Not Found | Correcto |
| Modificación de perfil propio con JWT | 200 OK con perfil actualizado | Correcto |
| Modificación de perfil ajeno con JWT | 403 Forbidden | Correcto |
| Modificación sin token | 401 Unauthorized | Correcto |

### Tests automáticos
- `backend-rest/tests/auth_usuarios.test.js`: cubre todos los casos anteriores.

## AI_LOG

### Herramienta usada
- Herramienta: Antigravity
- Modelo: Gemini 3.7 Flash

### Uso realizado
- Generación de funciones criptográficas para JWT y hashing con salt en `node:crypto`.
- Implementación de controladores REST con validaciones de entrada y control de acceso.
- Creación de pruebas automatizadas completas.

### Decisiones
- Se implementó un generador/validador JWT nativo con `node:crypto` (HMAC SHA-256) completamente compatible con la especificación RFC 7519, garantizando portabilidad absoluta y expiración temporal.

## COMMITS RELACIONADOS

- Pendiente de asignación tras el commit de la iteración.
