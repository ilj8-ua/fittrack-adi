# GUÍA MAESTRA DEFINITIVA PARA EL TEST DE CLASE EN MOODLE
**Asignatura:** Arquitectura y Desarrollo de Sistemas de Información (ADI)  
**Proyecto:** FitTrack - Práctica 1 (Backend REST + BaaS Supabase + SDD)  
**Estudiante:** Iván Lafont Jabazin (`ilj8`) - 51235963J  
**Fecha de evaluación:** Octubre 2026

---

> ⚡ **CÓMO USAR ESTE DOCUMENTO DURANTE EL TEST (10-15 MINUTOS):**  
> Usa **`Ctrl + F`** en tu editor/visor y escribe la palabra clave de la pregunta (por ejemplo: `JWT`, `token`, `iteración`, `403`, `401`, `salt`, `PBKDF2`, `paginación`, `RLS`, `USING`, `SQLite`, `hash`, `Location`, `commit`).  
> Este documento contiene **todas las respuestas exactas**, el archivo donde está el código, la función concreta y la justificación teórica.

---

## 📑 ÍNDICE RÁPIDO DE BÚSQUEDA

1. [BANCO DE PREGUNTAS Y RESPUESTAS RÁPIDAS (TOP EXAMEN)](#1-banco-de-preguntas-y-respuestas-rápidas-top-examen)
2. [FICHA DETALLADA POR ITERACIÓN SDD (COMMITS, SPECS, ARCHIVOS)](#2-ficha-detallada-por-iteración-sdd)
3. [DICCIONARIO COMPLETO DE RUTAS Y ENDPOINTS REST](#3-diccionario-completo-de-rutas-y-endpoints-rest)
4. [SEGURIDAD, CRIPTOGRAFÍA Y AUTENTICACIÓN JWT](#4-seguridad-criptografía-y-autenticación-jwt)
5. [RECURSO PRINCIPAL Y SECUNDARIO (CRUD, FILTROS, PAGINACIÓN)](#5-recurso-principal-y-secundario)
6. [BASE DE DATOS, SQLITE Y PERSISTENCIA](#6-base-de-datos-sqlite-y-persistencia)
7. [SEGUNDO BACKEND: SUPABASE BAAS, CAPA DE SERVICIOS Y RLS](#7-segundo-backend-supabase-baas-capa-de-servicios-y-rls)
8. [CÓDIGOS DE ESTADO HTTP Y MANEJO DE ERRORES](#8-códigos-de-estado-http-y-manejo-de-errores)
9. [TESTS AUTOMATIZADOS Y SUITE DE PRUEBAS](#9-tests-automatizados-y-suite-de-pruebas)

---

## 1. BANCO DE PREGUNTAS Y RESPUESTAS RÁPIDAS (TOP EXAMEN)

### 🔑 Autenticación y Tokens JWT
* **¿En qué iteración se implementó la autenticación con tokens JWT?**  
  👉 **Iteración 02** (Commit `fc120b6`, archivo `docs/iterations/02-backend-rest-auth-usuarios.md`).
* **¿Quién genera el token JWT?**  
  👉 El **servidor Backend REST**, mediante la función `generateJWT(payload)` en `backend-rest/src/utils/security.js`.
* **¿En qué endpoints se genera el token?**  
  👉 En `POST /api/auth/register` (al registrarse) y en `POST /api/auth/login` (al iniciar sesión), ambos en `backend-rest/src/routes/auth.js`.
* **¿Dónde y cómo se le envía el token al cliente?**  
  👉 En el **cuerpo de la respuesta HTTP en formato JSON**: `{ "mensaje": "...", "token": "...", "usuario": { ... } }`.
* **¿Cómo envía el cliente el token en las peticiones posteriores?**  
  👉 En la cabecera HTTP estándar: `Authorization: Bearer <token>`.
* **¿Quién valida el token en las rutas protegidas?**  
  👉 El middleware `authenticateToken` en `backend-rest/src/middleware/auth.js`, que invoca `verifyJWT(token)` de `security.js`.
* **¿Qué algoritmo y clave se usan para firmar el JWT?**  
  👉 Algoritmo **HMAC SHA-256 (`HS256`)** usando la clave secreta `JWT_SECRET` definida en `backend-rest/src/config.js`.
* **¿Qué datos contiene el payload del JWT?**  
  👉 `{ id, email, nombre, iat, exp }`. Caduca a las 24 horas (`86400` segundos).
* **¿Qué pasa si no se envía la cabecera Authorization?**  
  👉 Responde **`401 Unauthorized`** con `{ "error": "Acceso denegado: falta cabecera Authorization" }`.
* **¿Qué pasa si el token es falso, manipulado o expiró?**  
  👉 Responde **`401 Unauthorized`** con `{ "error": "Token inválido o expirado: ..." }`.

### 🔒 Contraseñas y Criptografía
* **¿Cómo se almacenan las contraseñas en la base de datos?**  
  👉 **Nunca en texto plano**. Se almacenan mediante hashing criptográfico **PBKDF2 con SHA-256**, 1000 iteraciones, longitud de clave de 64 bytes y un **Salt único aleatorio de 16 bytes** por usuario generado con `crypto.randomBytes(16)`.
* **¿Qué campos almacena la tabla `usuarios` para la contraseña?**  
  👉 `password_hash` (el hash en hexadecimal) y `salt` (el salt en hexadecimal).
* **¿Cómo se verifica la contraseña en el Login?**  
  👉 La función `verifyPassword(password, savedHash, savedSalt)` calcula de nuevo el hash con la contraseña introducida y el `salt` guardado en BD, y compara usando `crypto.timingSafeEqual()` para evitar ataques de temporización (*timing attacks*).
* **¿Se expone el hash o el salt en las respuestas JSON?**  
  👉 **No, jamás**. Ni en login, ni en registro, ni al consultar perfiles con `GET /api/usuarios/:id`.

### 👤 Usuarios y Perfiles
* **¿Qué ruta permite ver el perfil de un usuario?**  
  👉 `GET /api/usuarios/:id` (pública / cualquier usuario puede ver perfiles públicos).
* **¿Qué ruta permite editar el perfil de un usuario?**  
  👉 `PUT /api/usuarios/:id` (requiere token JWT).
* **¿Quién puede editar el perfil de un usuario?**  
  👉 **Únicamente el propio usuario dueño del perfil** (`req.usuario.id === parseInt(req.params.id)`).
* **¿Qué código HTTP se devuelve si un usuario intenta editar el perfil de otro?**  
  👉 **`403 Forbidden`** con `{ "error": "No tienes permiso para modificar el perfil de otro usuario" }`.
* **¿Qué código HTTP se devuelve si intentan registrar un email ya existente?**  
  👉 **`409 Conflict`** con `{ "error": "Ya existe un usuario registrado con ese email" }`.

### 🏋️ Recurso Principal: Rutinas
* **¿Cuál es el recurso principal de la aplicación?**  
  👉 **Rutinas (`rutinas`)** (planes o sesiones de entrenamiento de fuerza).
* **¿En qué iteración se implementó el CRUD de rutinas?**  
  👉 **Iteración 03** (Commit `62f3356`, archivo `docs/iterations/03-backend-rest-rutinas-crud-paginacion.md`).
* **¿Qué ruta crea una rutina?**  
  👉 `POST /api/rutinas`. Requiere JWT. Asigna automáticamente `usuario_id = req.usuario.id`.
* **¿Qué código HTTP devuelve la creación exitosa de una rutina?**  
  👉 **`201 Created`**, con la cabecera `Location: /api/rutinas/:id` y el JSON de la rutina creada.
* **¿Cómo se valida la creación de una rutina?**  
  👉 `nombre` obligatorio y $\ge 3$ caracteres; `descripcion` obligatoria; `nivel` debe ser 'principiante', 'intermedio' o 'avanzado'. Si no cumple $\rightarrow$ **`400 Bad Request`**.
* **¿Cómo funciona la paginación de rutinas?**  
  👉 En `GET /api/rutinas?page=1&limit=10`. Usa `LIMIT ? OFFSET ?` con `offset = (page - 1) * limit`. Realiza un `COUNT(*)` para obtener el `total` y calcula `total_paginas = Math.ceil(total / limit)`. Devuelve `{ data: [...], paginacion: { total, pagina, limite, total_paginas } }`.
* **¿Qué filtros de búsqueda se admiten en el listado de rutinas?**  
  👉 `?q=texto` (busca en `nombre` o `descripcion`), `?nivel=intermedio`, `?es_publica=1`, `?usuario_id=1`.
* **¿Quién puede ver una rutina privada (`es_publica = 0`)?**  
  👉 **Únicamente su creador**. Si otro usuario la consulta con `GET /api/rutinas/:id` se le devuelve **`403 Forbidden`**. Si es anónimo $\rightarrow$ **`403 Forbidden`**.
* **¿Cómo se obtiene el recurso secundario anidado junto con la rutina?**  
  👉 En `GET /api/rutinas/:id`, se hace una consulta SQL con `JOIN` entre `rutina_ejercicios` y `ejercicios`, devolviendo el objeto de la rutina con el campo `ejercicios: [...]`.
* **¿Quién puede modificar (`PUT /api/rutinas/:id`) o borrar (`DELETE /api/rutinas/:id`) una rutina?**  
  👉 **Únicamente el usuario creador**. Si otro usuario lo intenta $\rightarrow$ **`403 Forbidden`**.
* **¿Qué código devuelve el borrado de una rutina?**  
  👉 **`204 No Content`** (sin cuerpo).

### 🤸 Recurso Secundario: Ejercicios y Rutina-Ejercicios
* **¿Cuál es el recurso secundario de la aplicación?**  
  👉 **Ejercicios (`ejercicios`)** (catálogo de ejercicios) y su tabla intermedia de asignación **`rutina_ejercicios`**.
* **¿En qué iteración se implementó el recurso secundario?**  
  👉 **Iteración 04** (Commit `cce8c60`, archivo `docs/iterations/04-backend-rest-ejercicios-rutina.md`).
* **¿Qué rutas gestionan el catálogo de ejercicios?**  
  👉 `GET /api/ejercicios` (pública, filtro `?grupo_muscular=Pecho`) y `POST /api/ejercicios` (requiere JWT, crea ejercicio en catálogo).
* **¿Qué ruta asigna un ejercicio a una rutina?**  
  👉 `POST /api/rutinas/:id/ejercicios`. Requiere JWT. Solo el dueño de la rutina puede añadirle ejercicios (a otros $\rightarrow$ `403 Forbidden`).
* **¿Qué campos y validaciones tiene la asignación de ejercicio?**  
  👉 `ejercicio_id`, `series_objetivo`, `repeticiones_objetivo`, `orden`. Valida que `series_objetivo > 0` y `repeticiones_objetivo > 0`. Si no $\rightarrow$ **`400 Bad Request`**.
* **¿Qué ruta desasigna/elimina un ejercicio de una rutina?**  
  👉 `DELETE /api/rutinas/:id/ejercicios/:id_ejercicio_rutina`. Solo el dueño de la rutina. Devuelve **`204 No Content`**.

### ☁️ Segundo Backend: Supabase BaaS y RLS
* **¿En qué iteración se implementó el segundo backend de Supabase?**  
  👉 **Iteración 05** (Commit `21a7161`, archivo `docs/iterations/05-backend-supabase-capa-servicios.md`).
* **¿Qué es la Capa de Servicios (*Service Layer*)?**  
  👉 Es un módulo JavaScript ([`backend-supabase/src/servicios.js`](file:///c:/Users/lafon/Documents/5to/ADI/Práctica/backend-supabase/src/servicios.js)) que exporta funciones semánticas (`crearRutina`, `buscarRutinas`, `login`, `getPerfil`, etc.) para **aislar completamente al código cliente del SDK de Supabase**. El cliente nunca llama a `supabase.from(...)` ni a `supabase.auth` directamente.
* **¿Dónde están definidas las tablas y las políticas de seguridad de Supabase?**  
  👉 En el script SQL [`backend-supabase/schema.sql`](file:///c:/Users/lafon/Documents/5to/ADI/Práctica/backend-supabase/schema.sql).
* **¿Qué es Row Level Security (RLS) en Supabase / PostgreSQL?**  
  👉 Es un mecanismo de seguridad en la base de datos PostgreSQL que evalúa reglas de acceso fila a fila. Aunque un usuario malicioso manipule el código JavaScript en su navegador, **la base de datos rechaza la operación**.
* **¿Cómo se activa RLS en una tabla?**  
  👉 `ALTER TABLE public.rutinas ENABLE ROW LEVEL SECURITY;`
* **¿Qué diferencia hay entre `USING` y `WITH CHECK` en una política RLS?**  
  👉 **`USING`**: Comprueba las filas que ya existen al hacer `SELECT`, `UPDATE` o `DELETE`.  
  👉 **`WITH CHECK`**: Comprueba las filas nuevas o modificadas al hacer `INSERT` o `UPDATE`.
* **Ejemplo de política RLS para que solo el creador modifique su rutina:**  
  ```sql
  CREATE POLICY "Actualizar rutinas propias"
  ON public.rutinas FOR UPDATE TO authenticated
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);
  ```

### 💾 Base de Datos SQLite (Backend REST)
* **¿Qué motor de base de datos se usó en el backend REST y por qué?**  
  👉 **SQLite persistente** mediante el módulo nativo **`node:sqlite` (`DatabaseSync`)** de Node 24. Porque garantiza persistencia en disco en `backend-rest/data/fittrack.db` sin requerir servidores externos ni binarios C++ compilados que den fallos en Windows.
* **¿Cómo se activaron las claves foráneas en SQLite?**  
  👉 Con la sentencia SQL: `PRAGMA foreign_keys = ON;` al inicializar la conexión.
* **¿Cómo se borran los registros hijos al borrar una rutina o un usuario?**  
  👉 Mediante `ON DELETE CASCADE` en las claves foráneas de las tablas `rutinas` y `rutina_ejercicios`.
* **¿Cómo se ejecutan los tests para que no modifiquen la base de datos del disco?**  
  👉 En los tests se pasa `:memory:` a `initDB(':memory:')`, creando una base de datos en RAM aislada y efímera para cada test.

---

## 2. FICHA DETALLADA POR ITERACIÓN SDD

### 🔹 Iteración 01: Setup del Proyecto, Arquitectura y Base de Datos SQLite
* **Documento:** [`docs/iterations/01-setup-y-arquitectura.md`](file:///c:/Users/lafon/Documents/5to/ADI/Práctica/docs/iterations/01-setup-y-arquitectura.md)
* **Commit:** `9fbdfa6` - *Iteración 01: Setup del proyecto, arquitectura y base de datos SQLite*
* **Objetivo (SPEC):** Configurar repositorio git, `.gitignore`, Express 5, módulo de configuración y persistencia SQLite con creación automática de tablas e inserción de catálogo semilla.
* **Archivos creados/modificados:**
  - `backend-rest/package.json` (`"type": "module"`, scripts `start`, `dev`, `test`).
  - `backend-rest/src/config.js` (`PORT`, `JWT_SECRET`, `DB_PATH`).
  - `backend-rest/src/db/database.js` (`initDB`, `getDB`, esquema de tablas y 8 ejercicios semilla).
  - `backend-rest/src/app.js` (Express, middlewares `cors`, `express.json()`, ruta `GET /api/health`).
  - `backend-rest/src/server.js` (punto de entrada que arranca el puerto 3000).
  - `backend-rest/tests/setup.test.js` (test de tablas creadas y `/api/health`).
* **Fuera de alcance en esta iteración:** Rutas de autenticación, usuarios, rutinas y Supabase.
* **Uso de IA (AI_LOG):** Estructuración modular de Express y DDL de SQLite con tipos de datos correctos.

---

### 🔹 Iteración 02: Autenticación JWT y Gestión de Usuarios
* **Documento:** [`docs/iterations/02-backend-rest-auth-usuarios.md`](file:///c:/Users/lafon/Documents/5to/ADI/Práctica/docs/iterations/02-backend-rest-auth-usuarios.md)
* **Commit:** `fc120b6` - *Iteración 02: Autenticación JWT y gestión de perfiles de usuario*
* **Objetivo (SPEC):** Implementar registro, login con JWT, hashing seguro con salt, visualización de perfil y edición protegida solo por el propio usuario.
* **Archivos creados/modificados:**
  - `backend-rest/src/utils/security.js` (`hashPassword`, `verifyPassword`, `generateJWT`, `verifyJWT`).
  - `backend-rest/src/middleware/auth.js` (`authenticateToken`, `optionalAuth`).
  - `backend-rest/src/routes/auth.js` (`POST /register`, `POST /login`).
  - `backend-rest/src/routes/usuarios.js` (`GET /:id`, `PUT /:id`).
  - `backend-rest/src/app.js` (montaje de `/api/auth` y `/api/usuarios`).
  - `backend-rest/tests/auth_usuarios.test.js` (7 tests automatizados).
* **Decisión técnica importante:** Se implementó JWT con `node:crypto` HMAC SHA-256 (`HS256`) compatible con RFC 7519 y contraseñas cifradas con Salt individual para máxima seguridad.
* **Códigos HTTP clave:** `201` (registro), `200` (login y ver perfil), `400` (datos inválidos), `401` (credenciales erróneas o token ausente), `403` (intentar editar perfil ajeno), `409` (email duplicado).

---

### 🔹 Iteración 03: CRUD de Rutinas (Recurso Principal), Paginación y Filtros
* **Documento:** [`docs/iterations/03-backend-rest-rutinas-crud-paginacion.md`](file:///c:/Users/lafon/Documents/5to/ADI/Práctica/docs/iterations/03-backend-rest-rutinas-crud-paginacion.md)
* **Commit:** `62f3356` - *Iteración 03: CRUD de Rutinas, paginación, filtros de búsqueda y permisos de acceso*
* **Objetivo (SPEC):** CRUD completo de rutinas con validaciones, paginación con `LIMIT/OFFSET`, filtros de búsqueda (`?q=`), detalle anidando ejercicios y visibilidad de rutinas privadas protegida.
* **Archivos creados/modificados:**
  - `backend-rest/src/routes/rutinas.js` (`POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`).
  - `backend-rest/src/app.js` (montaje de `/api/rutinas`).
  - `backend-rest/tests/rutinas.test.js` (8 tests automatizados).
* **Decisiones técnicas:**
  - Paginación calculada en backend devolviendo metadatos (`total`, `pagina`, `limite`, `total_paginas`).
  - `GET /api/rutinas/:id` anida los ejercicios mediante consulta `JOIN`.
  - Rutinas privadas devuelven `403 Forbidden` si quien consulta no es el creador.
  - Edición y borrado restringidos exclusivamente al creador (`actual.usuario_id === req.usuario.id`).

---

### 🔹 Iteración 04: Recurso Secundario (Ejercicios y Asignaciones a Rutina)
* **Documento:** [`docs/iterations/04-backend-rest-ejercicios-rutina.md`](file:///c:/Users/lafon/Documents/5to/ADI/Práctica/docs/iterations/04-backend-rest-ejercicios-rutina.md)
* **Commit:** `cce8c60` - *Iteración 04: Recurso secundario de ejercicios y asignación a rutinas*
* **Objetivo (SPEC):** Gestión del catálogo global de ejercicios (`GET` y `POST`) y sub-recurso jerárquico `/api/rutinas/:id/ejercicios` para asignar y quitar ejercicios con validación estricta de series y repeticiones $> 0$.
* **Archivos creados/modificados:**
  - `backend-rest/src/routes/ejercicios.js` (`GET /`, `POST /`).
  - `backend-rest/src/routes/rutinas.js` (añadidos `GET /:id/ejercicios`, `POST /:id/ejercicios`, `DELETE /:id/ejercicios/:id_asig`).
  - `backend-rest/src/app.js` (montaje de `/api/ejercicios`).
  - `backend-rest/tests/ejercicios_rutina.test.js` (7 tests automatizados).
* **Validaciones clave:**
  - `series_objetivo` y `repeticiones_objetivo` deben ser números enteros $> 0$. Si se envía $\le 0$ devuelve `400 Bad Request`.
  - Solo el dueño de la rutina puede añadir o quitar ejercicios de ella (`403 Forbidden` a otros).

---

### 🔹 Iteración 05: Segundo Backend con Supabase BaaS, Capa de Servicios y RLS
* **Documento:** [`docs/iterations/05-backend-supabase-capa-servicios.md`](file:///c:/Users/lafon/Documents/5to/ADI/Práctica/docs/iterations/05-backend-supabase-capa-servicios.md)
* **Commit:** `21a7161` - *Iteración 05: Segundo Backend con Supabase BaaS, capa de servicios, esquema RLS y pruebas*
* **Objetivo (SPEC):** Desarrollar el segundo backend independiente (requisito de hasta 3 puntos) con Supabase, definiendo el esquema DDL con PostgreSQL, Row Level Security (RLS) y la capa de servicios desacoplada.
* **Archivos creados/modificados:**
  - `backend-supabase/package.json` (dependencia `@supabase/supabase-js`).
  - `backend-supabase/schema.sql` (tablas `usuarios`, `ejercicios`, `rutinas`, `rutina_ejercicios` y políticas RLS).
  - `backend-supabase/src/config.js` y `supabaseClient.js` (inicializador del SDK).
  - `backend-supabase/src/servicios.js` (capa de servicios con 15 funciones desacopladas).
  - `backend-supabase/tests/servicios.test.js` (5 tests de capa de servicios y validaciones).
* **Concepto clave:** El cliente frontend futuro jamás sabrá qué librería hay debajo, solo consumirá funciones JavaScript normales.

---

## 3. DICCIONARIO COMPLETO DE RUTAS Y ENDPOINTS REST

Prefijo general: `/api`

| Método | Ruta | Headers | Body (JSON) | Códigos Respuesta | Descripción y Seguridad |
|---|---|---|---|---|---|
| `GET` | `/api/health` | Ninguno | Ninguno | `200` | Comprobación de estado y versión de la API. |
| `POST` | `/api/auth/register` | `Content-Type: application/json` | `{ nombre, email, password, bio }` | `201`, `400`, `409` | Registra usuario, cifra password con salt, devuelve token JWT y usuario. |
| `POST` | `/api/auth/login` | `Content-Type: application/json` | `{ email, password }` | `200`, `400`, `401` | Verifica credenciales y retorna token JWT. |
| `GET` | `/api/usuarios/:id` | Opcional | Ninguno | `200`, `400`, `404` | Consulta de perfil público (omite hash y salt). |
| `PUT` | `/api/usuarios/:id` | `Authorization: Bearer <token>` | `{ nombre, bio }` | `200`, `400`, `401`, `403`, `404` | Edición de perfil. **Solo permitido si `req.usuario.id == :id`** (`403` a terceros). |
| `POST` | `/api/rutinas` | `Authorization: Bearer <token>` | `{ nombre, descripcion, nivel, es_publica }` | `201`, `400`, `401` | Crea rutina. Asigna `usuario_id` del token. Devuelve cabecera `Location`. |
| `GET` | `/api/rutinas` | Opcional | Ninguno (`?page=1&limit=10&q=pecho`) | `200` | Listado paginado. Públicas para todos; privadas solo para su creador. |
| `GET` | `/api/rutinas/:id` | Opcional | Ninguno | `200`, `400`, `403`, `404` | Detalle de rutina con ejercicios anidados. Privada $\rightarrow$ `403` a terceros. |
| `PUT` | `/api/rutinas/:id` | `Authorization: Bearer <token>` | `{ nombre, descripcion, nivel, es_publica }` | `200`, `400`, `401`, `403`, `404` | Modifica rutina. **Solo el creador** (`403` a terceros). |
| `DELETE` | `/api/rutinas/:id` | `Authorization: Bearer <token>` | Ninguno | `204`, `400`, `401`, `403`, `404` | Elimina rutina en cascada. **Solo el creador** (`403` a terceros). |
| `GET` | `/api/ejercicios` | Opcional | Ninguno (`?grupo_muscular=Pecho`) | `200` | Catálogo de ejercicios disponibles. |
| `POST` | `/api/ejercicios` | `Authorization: Bearer <token>` | `{ nombre, grupo_muscular, equipamiento }` | `201`, `400`, `401` | Crea un nuevo ejercicio en el catálogo. |
| `GET` | `/api/rutinas/:id/ejercicios` | Opcional | Ninguno | `200`, `400`, `403`, `404` | Lista ejercicios asignados a la rutina con series/reps. |
| `POST` | `/api/rutinas/:id/ejercicios` | `Authorization: Bearer <token>` | `{ ejercicio_id, series_objetivo, repeticiones_objetivo, orden }` | `201`, `400`, `401`, `403`, `404` | Asigna ejercicio a rutina. Valida series y reps $>0$. **Solo el creador de la rutina**. |
| `DELETE` | `/api/rutinas/:id/ejercicios/:id_ejercicio_rutina` | `Authorization: Bearer <token>` | Ninguno | `204`, `400`, `401`, `403`, `404` | Desasigna ejercicio de rutina. **Solo el creador de la rutina**. |

---

## 4. SEGURIDAD, CRIPTOGRAFÍA Y AUTENTICACIÓN JWT

### Esquema del Token JWT:
Un JSON Web Token tiene 3 partes separadas por puntos (`.`):
$$\text{Header}.\text{Payload}.\text{Signature}$$
1. **Header (Base64Url):** `{"alg":"HS256","typ":"JWT"}`
2. **Payload (Base64Url):** `{"id":1,"email":"ivan@ua.es","nombre":"Iván L","iat":1728220000,"exp":1728306400}`
3. **Signature (Firma):** `HMACSHA256(Header + "." + Payload, JWT_SECRET)`

### Flujo Completo de Autenticación:
```
[Cliente]  --- POST /api/auth/login {email, password} ---> [Servidor REST]
[Cliente]  <-- 200 OK { token: "eyJ...", usuario: {...} } -- [Servidor REST] (guarda token en cliente)
   ...
[Cliente]  --- GET /api/rutinas (Header "Authorization: Bearer eyJ...") ---> [authenticateToken middleware]
                                                                                |
                                                                             ¿Token válido?
                                                                           /                \
                                                                         SÍ                  NO
                                                                         /                    \
                                                            Inyecta req.usuario           401 Unauthorized
                                                            Pasa a la ruta con next()
```

### Contraseñas (Hashing y Salt):
* **Fórmula:** $\text{Hash} = \text{PBKDF2}(\text{password}, \text{salt}, \text{iteraciones}=1000, \text{longitud}=64, \text{algoritmo}=\text{"sha256"})$
* **¿Por qué usar Salt?** Porque si dos usuarios tienen la misma contraseña (ej: `123456`), sus hashes serán totalmente diferentes, impidiendo ataques con tablas arcoíris (*rainbow tables*).
* **¿Por qué `timingSafeEqual`?** Evita ataques donde un atacante mide en microsegundos cuánto tarda la CPU en comparar cadenas para adivinar caracteres.

---

## 5. RECURSO PRINCIPAL Y SECUNDARIO

### Relación entre Recursos:
$$\text{Usuario } (1) \xrightarrow{\text{crea}} (N) \text{ Rutina } (1) \xrightarrow{\text{contiene}} (N) \text{ RutinaEjercicio } (N) \xleftarrow{\text{asigna}} (1) \text{ Ejercicio}$$

* **Recurso Principal:** `rutinas`
  - Campos: `id`, `usuario_id`, `nombre`, `descripcion`, `nivel`, `es_publica`, `fecha_creacion`.
* **Recurso Secundario:** `ejercicios` y relación intermedia `rutina_ejercicios`
  - Campos de `ejercicios`: `id`, `nombre`, `grupo_muscular`, `equipamiento`, `creador_id`.
  - Campos de `rutina_ejercicios`: `id`, `rutina_id`, `ejercicio_id`, `series_objetivo`, `repeticiones_objetivo`, `orden`.

### Lógica de Paginación en Backend REST:
```javascript
let page = parseInt(req.query.page, 10) || 1;
let limit = parseInt(req.query.limit, 10) || 10;
const offset = (page - 1) * limit;

// Consulta con LIMIT y OFFSET
const listSql = `SELECT r.*, u.nombre as creador_nombre 
                 FROM rutinas r JOIN usuarios u ON r.usuario_id = u.id 
                 ${whereClause} 
                 ORDER BY r.fecha_creacion DESC 
                 LIMIT ? OFFSET ?`;
const data = db.prepare(listSql).all(...params, limit, offset);
```

### Anidación de Recurso Secundario (`GET /api/rutinas/:id`):
```javascript
const ejercicios = db.prepare(`
  SELECT re.id as id_rutina_ejercicio, re.series_objetivo, re.repeticiones_objetivo, re.orden,
         e.id as ejercicio_id, e.nombre, e.grupo_muscular, e.equipamiento
  FROM rutina_ejercicios re
  JOIN ejercicios e ON re.ejercicio_id = e.id
  WHERE re.rutina_id = ?
  ORDER BY re.orden ASC
`).all(rutinaId);

res.json({ ...rutina, ejercicios });
```

---

## 6. BASE DE DATOS, SQLITE Y PERSISTENCIA

### Tablas SQLite en `backend-rest/src/db/database.js`:
```sql
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  bio TEXT DEFAULT '',
  fecha_registro TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ejercicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  grupo_muscular TEXT NOT NULL,
  equipamiento TEXT NOT NULL,
  creador_id INTEGER,
  FOREIGN KEY (creador_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS rutinas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  nivel TEXT NOT NULL DEFAULT 'intermedio',
  es_publica INTEGER NOT NULL DEFAULT 1,
  fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rutina_ejercicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rutina_id INTEGER NOT NULL,
  ejercicio_id INTEGER NOT NULL,
  series_objetivo INTEGER NOT NULL CHECK (series_objetivo > 0),
  repeticiones_objetivo INTEGER NOT NULL CHECK (repeticiones_objetivo > 0),
  orden INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE CASCADE,
  FOREIGN KEY (ejercicio_id) REFERENCES ejercicios(id) ON DELETE CASCADE
);
```

---

## 7. SEGUNDO BACKEND: SUPABASE BAAS, CAPA DE SERVICIOS Y RLS

### Comparativa: Backend REST vs Supabase BaaS en este Proyecto:
| Característica | Backend REST (`backend-rest`) | Backend Supabase (`backend-supabase`) |
|---|---|---|
| **Plataforma** | Node.js + Express 5 propia | Supabase (PostgreSQL en la nube o emulado) |
| **Punto de acceso** | Peticiones HTTP a API REST (`fetch`/HTTP) | Funciones de Capa de Servicios JavaScript |
| **Persistencia** | SQLite nativo en fichero `fittrack.db` | PostgreSQL relacional |
| **Autorización** | Middleware en Node.js (`authenticateToken`) | **Row Level Security (RLS)** en el motor PostgreSQL |
| **Manejo de contraseñas** | PBKDF2/SHA-256 en Node.js | Gestionado por Supabase Auth (`auth.users`) |
| **Aislamiento** | Controladores en `src/routes/` | Funciones exportadas en `servicios.js` |

### Funciones de la Capa de Servicios (`servicios.js`):
1. **Autenticación:**
   - `registro(email, password, nombre, bio)` $\rightarrow$ llama `supabase.auth.signUp()`.
   - `login(email, password)` $\rightarrow$ llama `supabase.auth.signInWithPassword()`.
   - `logout()` $\rightarrow$ llama `supabase.auth.signOut()`.
   - `getUsuarioActual()` $\rightarrow$ llama `supabase.auth.getSession()`.
   - `getPerfil(usuarioId)` $\rightarrow$ consulta tabla `usuarios`.
   - `updatePerfil(usuarioId, { nombre, bio })` $\rightarrow$ actualiza tabla `usuarios`.
2. **Recurso Principal (Rutinas):**
   - `crearRutina(datos)` $\rightarrow$ inserta en `rutinas`.
   - `buscarRutinas(filtros)` $\rightarrow$ consulta paginada con `.range(offset, offset + limit - 1)`.
   - `getRutinaConEjercicios(rutinaId)` $\rightarrow$ select anidado de `rutinas` con `rutina_ejercicios` y `ejercicios`.
   - `updateRutina(rutinaId, datos)` $\rightarrow$ actualiza `rutinas`.
   - `borrarRutina(rutinaId)` $\rightarrow$ elimina de `rutinas`.
3. **Recurso Secundario (Ejercicios):**
   - `getEjercicios(grupoMuscular)` $\rightarrow$ consulta `ejercicios`.
   - `crearEjercicio(datos)` $\rightarrow$ inserta en `ejercicios`.
   - `addEjercicioARutina(rutinaId, ejercicioId, series, reps, orden)` $\rightarrow$ inserta en `rutina_ejercicios`.
   - `borrarEjercicioDeRutina(asigId)` $\rightarrow$ elimina de `rutina_ejercicios`.

---

## 8. CÓDIGOS DE ESTADO HTTP Y MANEJO DE ERRORES

| Código | Significado | Situación exacta en la práctica |
|:---:|---|---|
| **200** | **OK** | Login correcto, perfil obtenido, rutinas listadas, rutina modificada. |
| **201** | **Created** | Usuario registrado, rutina creada, ejercicio creado, ejercicio asignado. Incluye cabecera `Location`. |
| **204** | **No Content** | Rutina eliminada con éxito, o ejercicio desasignado con éxito (sin cuerpo). |
| **400** | **Bad Request** | Validación fallida: nombre de rutina < 3 letras, series $\le 0$, password < 6 letras, formato email erróneo. |
| **401** | **Unauthorized** | Falta token JWT en cabecera, token manipulado o expirado, credenciales erróneas en login. |
| **403** | **Forbidden** | Usuario autenticado pero sin permiso: intentar modificar el perfil de otro, editar/borrar la rutina de otro, o ver una rutina privada de otro. |
| **404** | **Not Found** | Ruta inexistente, o usuario, rutina o ejercicio inexistente en la BD. |
| **409** | **Conflict** | Registro con un email que ya está en uso por otra cuenta. |
| **500** | **Internal Server Error** | Fallo no controlado, capturado por el middleware de error `(err, req, res, next)` en `app.js`. |

---

## 9. TESTS AUTOMATIZADOS Y SUITE DE PRUEBAS

* **Comando para ejecutarlos:** `npm test` (o `npm.cmd test`).
* **Total de pruebas:** **34 tests** (29 en REST, 5 en Supabase). Todos pasan en verde (**0 fallos**).
* **Runner utilizado:** `node:test` y `node:assert/strict` nativo de Node.js 24 (sin necesidad de Jest o Mocha externos).
* **Archivos de test:**
  1. `backend-rest/tests/setup.test.js`: Comprueba inicialización de tablas SQLite, sembrado de ejercicios y endpoint `/api/health`.
  2. `backend-rest/tests/auth_usuarios.test.js`: Registro, login, passwords cortas, emails duplicados (`409`), perfil y protección (`403`).
  3. `backend-rest/tests/rutinas.test.js`: Creación, paginación, búsqueda `?q=`, detalle anidado, protección de rutinas privadas (`403`) y borrado.
  4. `backend-rest/tests/ejercicios_rutina.test.js`: Catálogo, asignación con validación de series/reps $> 0$, permisos de dueño y borrado.
  5. `backend-supabase/tests/servicios.test.js`: Valida todas las funciones de la capa de servicios, contratos de datos, paginación y manejo de errores.

---

## 10. PREGUNTAS TRAMPA / CONCEPTUALES QUE PUEDE HACER EL PROFESOR

* **¿Por qué no hay nada de HTML ni CSS en la entrega?**  
  👉 Porque el enunciado de la Práctica 1 prohibía expresamente escribir frontend (*"TODAVÍA NO SE DEBE ESCRIBIR NADA DE CÓDIGO DEL FRONTEND"*). El backend se comprueba con pruebas automatizadas y peticiones HTTP.
* **¿Cuál es la diferencia entre 401 y 403?**  
  👉 **`401 Unauthorized`** es un problema de **autenticación** (no sé quién eres; falta el token o no es válido).  
  👉 **`403 Forbidden`** es un problema de **autorización** (sé quién eres porque tu token es válido, pero **no tienes permiso** para tocar ese recurso ajeno).
* **¿Por qué `req.body` no funciona si no pones `app.use(express.json())`?**  
  👉 Porque por defecto Node y Express reciben los datos HTTP como un flujo binario de texto (*stream*). `express.json()` es el middleware que lee el flujo, comprueba que el Content-Type sea `application/json`, lo parsea y lo inyecta como objeto en `req.body`.
* **¿Cómo determina Node si un archivo es un módulo ES (`import`) o CommonJS (`require`)?**  
  👉 Por la propiedad `"type": "module"` en el archivo `package.json` del proyecto, o por la extensión `.mjs` vs `.cjs`.
* **¿Qué es la integridad referencial y cómo se aplicó?**  
  👉 Es la garantía de que una clave foránea apunta a un registro real existente. Se activó con `PRAGMA foreign_keys = ON;` y se configuró `ON DELETE CASCADE` para que al borrar una rutina se borren automáticamente todos sus ejercicios asignados sin dejar registros huérfanos.
