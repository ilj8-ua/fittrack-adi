# GUÍA DE PREPARACIÓN PARA EL MINI-TEST DE CLASE (MOODLE)
**FitTrack - Práctica 1 (ADI)**  
**Estudiante:** Iván Lafont Jabazin (`ilj8`) - 51235963J

> 📌 **Objetivo del documento**: Servir de referencia rápida y precisa durante el test presencial en Moodle de 10-15 minutos (sin uso de IA). Contiene todas las respuestas clave sobre la arquitectura, código, flujos de datos, seguridad, iteraciones y decisiones de diseño.

---

## 📋 1. MAPA DE ITERACIONES SDD Y COMMITS

| Iteración | Documento SDD | Commit Hash | Funcionalidad Principal Implementada |
|---|---|---|---|
| **Iteración 01** | `docs/iterations/01-setup-y-arquitectura.md` | `9fbdfa6` | Setup del proyecto, configuración Express, base de datos SQLite persistente con `node:sqlite`, tablas relacionales y endpoint de salud `/api/health`. |
| **Iteración 02** | `docs/iterations/02-backend-rest-auth-usuarios.md` | `fc120b6` | Autenticación JWT, hashing de contraseñas con Salt, endpoints de registro (`POST /api/auth/register`), login (`POST /api/auth/login`), y ver/editar perfil (`/api/usuarios/:id`). |
| **Iteración 03** | `docs/iterations/03-backend-rest-rutinas-crud-paginacion.md` | `62f3356` | CRUD de Rutinas (recurso principal), paginación (`page`, `limit`), búsqueda por texto (`q`), detalle con recurso secundario anidado y control de visibilidad pública/privada. |
| **Iteración 04** | `docs/iterations/04-backend-rest-ejercicios-rutina.md` | `cce8c60` | Recurso secundario: catálogo de ejercicios (`/api/ejercicios`), asignación a rutinas (`POST /api/rutinas/:id/ejercicios`), validación de series/reps > 0 y desasignación. |
| **Iteración 05** | `docs/iterations/05-backend-supabase-capa-servicios.md` | `21a7161` | Segundo backend (BaaS): Esquema PostgreSQL con **Row Level Security (RLS)** en `schema.sql`, capa de servicios en `servicios.js` y tests automatizados. |

---

## 🔐 2. AUTENTICACIÓN Y SEGURIDAD (PREGUNTAS FRECUENTES DEL TEST)

### ¿En qué iteración se implementó la autenticación y los tokens JWT?
- **Iteración 02** (commit `fc120b6`).

### ¿Quién genera el token JWT y dónde?
- **Quién**: El servidor Backend REST.
- **Archivo**: `backend-rest/src/utils/security.js` en la función `generateJWT(payload)`.
- **Invocado en**: Los controladores de `POST /api/auth/register` y `POST /api/auth/login` (en `backend-rest/src/routes/auth.js`).
- **Cómo**: Se construye un token estándar (formato Base64Url con algoritmo HMAC SHA-256 `HS256`, cabecera, payload con `id`, `email`, `nombre`, `iat` y `exp` de 24 horas, y firma con la clave secreta `JWT_SECRET`).

### ¿Dónde y cómo se le envía el token al cliente?
- **En el cuerpo de la respuesta HTTP (JSON)** tanto en el registro como en el login:
  ```json
  {
    "mensaje": "Autenticación satisfactoria",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": { "id": 1, "nombre": "Iván L", "email": "ivan@ua.es" }
  }
  ```

### ¿Cómo envía el cliente el token en las peticiones posteriores?
- En la cabecera HTTP:
  ```http
  Authorization: Bearer <token_jwt>
  ```

### ¿Quién valida el token en las peticiones entrantes?
- El middleware `authenticateToken` en `backend-rest/src/middleware/auth.js`.
- Extrae la cabecera `Authorization`, separa el prefijo `Bearer`, verifica la firma criptográfica y la fecha de expiración con `verifyJWT(token)` en `security.js`, y almacena los datos decodificados en `req.usuario`.

### ¿Cómo se guardan y verifican las contraseñas?
- **Nunca en texto plano**.
- Se utiliza la función `hashPassword(password)` en `security.js` con **PBKDF2 y HMAC-SHA256**:
  - Se genera un **Salt criptográfico aleatorio único** de 16 bytes (`crypto.randomBytes(16).toString('hex')`).
  - Se calcula el hash derivado (`crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256')`).
  - Se guardan en la tabla `usuarios` tanto el `password_hash` como el `salt`.
- Para comprobar en login: `verifyPassword(password, savedHash, savedSalt)` calcula el hash con el salt guardado y compara con `crypto.timingSafeEqual` para prevenir ataques de temporización (*timing attacks*).

---

## 📦 3. RECURSO PRINCIPAL Y RECURSO SECUNDARIO

### ¿Cuál es el recurso principal y cuáles los secundarios?
- **Recurso Principal**: **Rutinas (`rutinas`)** (un plan de entrenamiento creado por un usuario).
- **Recurso Secundario**: **Ejercicios (`ejercicios`)** y su asignación intermedia **`rutina_ejercicios`** (con atributos propios: `series_objetivo`, `repeticiones_objetivo`, `orden`).

### ¿Cómo se obtiene el recurso secundario anidado junto con el principal?
- **Ruta**: `GET /api/rutinas/:id` (en `backend-rest/src/routes/rutinas.js`).
- **Implementación**: El endpoint consulta la rutina y realiza una consulta con `JOIN` a `rutina_ejercicios` y `ejercicios`:
  ```sql
  SELECT re.id as id_rutina_ejercicio, re.series_objetivo, re.repeticiones_objetivo, re.orden,
         e.id as ejercicio_id, e.nombre, e.grupo_muscular, e.equipamiento
  FROM rutina_ejercicios re
  JOIN ejercicios e ON re.ejercicio_id = e.id
  WHERE re.rutina_id = ?
  ORDER BY re.orden ASC;
  ```
  Devuelve el objeto de la rutina conteniendo el array `ejercicios: [...]`.

### ¿Cómo funciona la paginación y búsqueda del recurso principal?
- **Ruta**: `GET /api/rutinas?page=1&limit=10&q=pecho&nivel=intermedio`
- **Implementación**:
  - `LIMIT ? OFFSET ?` calculando `offset = (page - 1) * limit`.
  - Conteo total con `COUNT(*)` aplicando los mismos filtros.
  - Retorna metadatos:
    ```json
    {
      "data": [ ... ],
      "paginacion": {
        "total": 25,
        "pagina": 1,
        "limite": 10,
        "total_paginas": 3
      }
    }
    ```

### ¿Qué reglas de visibilidad y permisos se aplican?
- **Visibilidad**:
  - Rutinas públicas (`es_publica = 1`): cualquier usuario o anónimo puede verlas.
  - Rutinas privadas (`es_publica = 0`): solo su creador (`req.usuario.id === rutina.usuario_id`).
- **Edición y Borrado**:
  - Únicamente el usuario creador (`req.usuario.id === rutina.usuario_id`). Si otro usuario intenta modificar o borrar -> **`403 Forbidden`**. Si no está autenticado -> **`401 Unauthorized`**.

---

## 🌐 4. CÓDIGOS DE ESTADO HTTP UTILIZADOS

| Código HTTP | Significado | Dónde / Cuándo se devuelve |
|---|---|---|
| **`200 OK`** | Petición correcta con datos | `GET /api/rutinas`, `GET /api/rutinas/:id`, `POST /api/auth/login`, `PUT /api/usuarios/:id`, `PUT /api/rutinas/:id`. |
| **`201 Created`** | Recurso creado exitosamente | `POST /api/auth/register`, `POST /api/rutinas` (con cabecera `Location`), `POST /api/ejercicios`, `POST /api/rutinas/:id/ejercicios`. |
| **`204 No Content`** | Eliminación exitosa sin cuerpo | `DELETE /api/rutinas/:id`, `DELETE /api/rutinas/:id/ejercicios/:id_asig`. |
| **`400 Bad Request`** | Error de validación en parámetros | Nombres cortos (<3 chars), series <= 0, repeticiones <= 0, email inválido, contraseñas < 6 caracteres. |
| **`401 Unauthorized`** | No autenticado / token inválido | Falta cabecera `Authorization`, token expirado, credenciales erróneas en login. |
| **`403 Forbidden`** | Autenticado pero sin permiso | Usuario autenticado intentando editar el perfil de otro, o intentando editar/borrar la rutina de otro. |
| **`404 Not Found`** | Recurso no encontrado | Usuario, rutina o ejercicio inexistente en la base de datos. |
| **`409 Conflict`** | Conflicto de unicidad | Intento de registrar un email que ya existe en la base de datos. |
| **`500 Internal Error`** | Error no controlado en servidor | Capturado por el middleware de error centralizado al final de `app.js`. |

---

## 🗄️ 5. BASE DE DATOS Y PERSISTENCIA

### Backend REST
- **Tecnología**: SQLite persistente en disco (`data/fittrack.db`) usando el módulo nativo `node:sqlite` (`DatabaseSync`) de Node 24.
- **Claves foráneas**: Activadas explícitamente mediante `PRAGMA foreign_keys = ON;`.
- **Integridad referencial**: `ON DELETE CASCADE` en `rutinas` y `rutina_ejercicios` para que al borrar un usuario o rutina se limpien automáticamente sus datos asociados.
- **Modo en memoria (`:memory:`)**: Utilizado dinámicamente en los tests automatizados para asegurar aislamiento total y velocidad sin alterar los datos del disco.

### Backend Supabase (BaaS)
- **Tecnología**: PostgreSQL gestionado por Supabase.
- **Autorización**: **Row Level Security (RLS)** activado en todas las tablas (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
- **Políticas en `schema.sql`**:
  - `CREATE POLICY "Lectura de rutinas publicas o propias" ON public.rutinas FOR SELECT USING (es_publica = true OR auth.uid() = usuario_id);`
  - `CREATE POLICY "Actualizar rutinas propias" ON public.rutinas FOR UPDATE USING (auth.uid() = usuario_id);`
  - `CREATE POLICY "Borrar rutinas propias" ON public.rutinas FOR DELETE USING (auth.uid() = usuario_id);`

---

## 🔌 6. CAPA DE SERVICIOS EN SUPABASE (`servicios.js`)

### ¿Para qué sirve la capa de servicios?
- Aísla completamente al código cliente del SDK de Supabase. El cliente no llama a `supabase.from(...)` ni a `supabase.auth...` directamente, sino a funciones semánticas de JavaScript:
  - `registro(email, password, nombre, bio)`
  - `login(email, password)`
  - `logout()`
  - `getUsuarioActual()`
  - `crearRutina(datos)`
  - `buscarRutinas(filtros)`
  - `getRutinaConEjercicios(rutinaId)`
  - `updateRutina(rutinaId, datos)`
  - `borrarRutina(rutinaId)`
  - `addEjercicioARutina(rutinaId, ejercicioId, series, reps, orden)`
  - `borrarEjercicioDeRutina(asigId)`

---

## 🧪 7. CÓMO EJECUTAR Y COMPROBAR TODO

```bash
# 1. Ejecutar las 34 pruebas automatizadas (ambos backends):
npm test

# 2. Ejecutar solo las pruebas del backend REST:
npm run test:rest

# 3. Ejecutar solo las pruebas del backend Supabase:
npm run test:supabase

# 4. Arrancar el servidor Backend REST:
npm run start:rest
# Servidor escuchando en: http://localhost:3000
# Comprobación de salud: http://localhost:3000/api/health
```
