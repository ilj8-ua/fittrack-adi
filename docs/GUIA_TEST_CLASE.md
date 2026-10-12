# GUÍA MAESTRA UNIVERSAL PARA EL TEST DE CLASE (MOODLE)
**Asignatura:** Arquitectura y Desarrollo de Sistemas de Información (ADI)  
**Evaluación:** Mini-Test presencial en Moodle sobre la Práctica 1 (10-15 minutos)  
**Estudiante:** Iván Lafont Jabazin (`ilj8`) - 51235963J | **Proyecto:** FitTrack  
**Calificación máxima objetivo:** 10 / 10

---

> ⚡ **CÓMO USAR ESTA GUÍA DURANTE EL TEST EN MOODLE:**  
> Como el examen es **el mismo para todos los alumnos** de la asignatura (independientemente del tema de su proyecto: películas, recetas, crowdfunding, coches, gimnasio/FitTrack...), este documento incluye:
> 1. **La Respuesta Teórica Universal de la Asignatura** (el concepto estándar que busca la pregunta tipo test de Moodle).
> 2. **La Respuesta Específica de tu Proyecto** (dónde está en tu código, qué archivo, qué iteración y qué commit).
> 
> Durante el test, pulsa **`Ctrl + F`** y escribe **1 o 2 palabras clave** (ejemplos: `JWT`, `401`, `403`, `RLS`, `USING`, `CHECK`, `Location`, `commit`, `iteracion`, `Express`, `paginacion`, `salt`, `PBKDF2`, `node_modules`).

---

## 📑 ÍNDICE TEMÁTICO DE BÚSQUEDA RÁPIDA

1. [BANCO DE PREGUNTAS TIPO TEST RESUELTAS (MÁS DE 50 PREGUNTAS)](#1-banco-de-preguntas-tipo-test-resueltas)
2. [CONCEPTOS UNIVERSALES DEL EXAMEN (VÁLIDOS PARA TODOS LOS PROYECTOS)](#2-conceptos-universales-del-examen)
3. [AUTENTICACIÓN JWT Y SEGURIDAD (PREGUNTA ESTRELLA)](#3-autenticación-jwt-y-seguridad)
4. [RECURSO PRINCIPAL Y SECUNDARIO (CRUD, FILTROS, PAGINACIÓN)](#4-recurso-principal-y-secundario)
5. [CÓDIGOS DE ESTADO HTTP Y CABECERAS REST](#5-códigos-de-estado-http-y-cabeceras-rest)
6. [NODE.JS Y EXPRESS 5 (MIDDLEWARES, RUTAS, ASINCRONÍA)](#6-nodejs-y-express-5)
7. [SUPABASE BAAS, CAPA DE SERVICIOS Y ROW LEVEL SECURITY (RLS)](#7-supabase-baas-capa-de-servicios-y-rls)
8. [METODOLOGÍA SDD Y DOCUMENTACIÓN OBLIGATORIA](#8-metodología-sdd-y-documentación)
9. [FICHA RESUMEN DE TUS 5 ITERACIONES Y COMMITS](#9-ficha-resumen-de-tus-5-iteraciones-y-commits)
10. [PREGUNTAS TRAMPA FRECUENTES EN ADI](#10-preguntas-trampa-frecuentes-en-adi)

---

## 1. BANCO DE PREGUNTAS TIPO TEST RESUELTAS

### 🔑 Bloque A: Autenticación, JWT y Usuarios
1. **¿En qué iteración se implementó la autorización con tokens JWT?**  
   - *Respuesta Universal:* En la iteración dedicada a la autenticación de usuarios.  
   - *En tu proyecto:* **Iteración 02** (Commit `fc120b6`, archivo `docs/iterations/02-backend-rest-auth-usuarios.md`).
2. **¿Quién genera el token JWT?**  
   - *Respuesta:* **El servidor backend**, tras comprobar que las credenciales (email y password) del usuario son correctas. En tu código: la función `generateJWT(payload)` en `backend-rest/src/utils/security.js`.
3. **¿En qué operaciones o endpoints se genera y entrega el token?**  
   - *Respuesta:* En el **Login** (`POST /api/auth/login`) y en el **Registro** (`POST /api/auth/register`).
4. **¿Dónde y cómo se le envía el token al cliente?**  
   - *Respuesta:* **En el cuerpo de la respuesta HTTP en formato JSON** (`res.json({ token, usuario })`). Nunca en la cabecera de respuesta ni en la URL.
5. **¿Cómo envía el cliente el token en las peticiones posteriores para autenticarse?**  
   - *Respuesta:* En la cabecera HTTP estándar de la petición: `Authorization: Bearer <token_jwt>`.
6. **¿Quién valida el token en las rutas protegidas del backend?**  
   - *Respuesta:* Un **middleware de autenticación** (`authenticateToken` en `backend-rest/src/middleware/auth.js`) que intercepta la petición, verifica la firma criptográfica y la expiración con `verifyJWT()`, y añade el usuario a la petición (`req.usuario`).
7. **¿Qué algoritmo criptográfico y secreto se usa para firmar el token JWT?**  
   - *Respuesta:* Algoritmo **HMAC SHA-256 (`HS256`)** con una clave secreta (`JWT_SECRET`).
8. **¿Qué partes componen un token JWT?**  
   - *Respuesta:* Tres partes en Base64Url separadas por puntos (`.`): **Header** (algoritmo y tipo), **Payload** (datos del usuario: id, email, fecha emisión `iat`, expiración `exp`), y **Signature** (firma criptográfica).
9. **¿Cómo se almacenan las contraseñas en la base de datos?**  
   - *Respuesta:* **NUNCA en texto plano**. Se almacenan mediante una función de derivación/hashing criptográfico (como **PBKDF2**, bcrypt o Argon2) combinada con un **Salt único y aleatorio** por cada usuario.
10. **¿Para qué sirve el Salt en el almacenamiento de contraseñas?**  
    - *Respuesta:* Para evitar que dos usuarios con la misma contraseña tengan el mismo hash, impidiendo ataques con tablas arcoíris (*rainbow tables*).
11. **¿Qué campos almacena la tabla de usuarios para la autenticación?**  
    - *Respuesta:* `password_hash` y `salt` (además de `id`, `email`, `nombre`, `fecha_registro`).
12. **¿Cómo se comprueba la contraseña en el Login?**  
    - *Respuesta:* Se toma la contraseña escrita por el usuario, se le aplica el mismo algoritmo de hash usando el `salt` guardado en la base de datos, y se compara el resultado con el `password_hash` almacenado (usando comparación en tiempo constante `crypto.timingSafeEqual` para evitar ataques de temporización).
13. **¿Se devuelve el password_hash o el salt al cliente en las respuestas JSON?**  
    - *Respuesta:* **NO, jamás**. Deben eliminarse u omitirse siempre de las respuestas de login, registro o consulta de perfil.
14. **¿Quién puede editar el perfil de un usuario (`PUT /usuarios/:id`)?**  
    - *Respuesta:* **Únicamente el propio usuario autenticado** cuyo id coincida con el id del perfil (`req.usuario.id === req.params.id`). Si intenta editar el de otro devuelve **`403 Forbidden`**.

---

### 📦 Bloque B: Recurso Principal y Recurso Secundario
15. **¿Qué es el recurso principal y qué es el recurso secundario en la práctica?**  
    - *Respuesta Universal:* El recurso principal es la entidad central de la app (recetas, películas, proyectos, etc.). El secundario es una entidad subordinada relacionada (comentarios, ingredientes, tiers, ejercicios de una rutina).  
    - *En tu proyecto:* Principal = **Rutinas (`rutinas`)**. Secundario = **Ejercicios (`ejercicios`)** y asignaciones en **`rutina_ejercicios`**.
16. **¿En qué iteración se implementó el CRUD del recurso principal?**  
    - *Respuesta en tu proyecto:* **Iteración 03** (Commit `62f3356`).
17. **¿En qué iteración se implementó el recurso secundario?**  
    - *Respuesta en tu proyecto:* **Iteración 04** (Commit `cce8c60`).
18. **¿Qué código HTTP se devuelve al crear con éxito un elemento del recurso principal?**  
    - *Respuesta:* **`201 Created`**.
19. **¿Qué cabecera HTTP debe acompañar a una respuesta 201 Created según el estándar REST?**  
    - *Respuesta:* La cabecera **`Location`**, indicando la URL donde se puede consultar el recurso creado (ej: `Location: /api/rutinas/5`).
20. **¿Cómo se implementa la paginación en el backend?**  
    - *Respuesta:* Mediante parámetros de consulta en la URL (típicamente `page` y `limit`), calculando en la consulta SQL `LIMIT limit OFFSET offset`, donde $\text{offset} = (\text{page} - 1) \times \text{limit}$. Además se ejecuta un `SELECT COUNT(*)` para devolver el total de elementos y páginas disponibles.
21. **¿Qué estructura devuelve un listado paginado?**  
    - *Respuesta:* Un objeto JSON con el array de datos y los metadatos de paginación:  
      `{ data: [...], paginacion: { total: 25, pagina: 1, limite: 10, total_paginas: 3 } }`.
22. **¿Cómo se obtiene un recurso principal junto con su recurso secundario relacionado?**  
    - *Respuesta:* Mediante una petición `GET /api/recurso_principal/:id` que realiza en el backend una consulta con **`JOIN`** a la tabla del recurso secundario, devolviendo un objeto único con el array secundario anidado (ej: la rutina con su propiedad `ejercicios: [...]`).
23. **¿Quién puede modificar o eliminar un recurso principal?**  
    - *Respuesta:* **Únicamente el usuario creador/propietario** del recurso.
24. **¿Qué código HTTP se devuelve al eliminar un recurso con éxito?**  
    - *Respuesta:* **`204 No Content`** (respuesta vacía sin cuerpo).
25. **¿Qué validaciones deben aplicarse al crear o editar recursos?**  
    - *Respuesta:* Validación de tipos, campos obligatorios no vacíos (longitud mínima), valores numéricos positivos estrictos ($> 0$, ej: series, repeticiones, precio, tiempo) y formatos válidos. Si no se cumplen, se rechaza con **`400 Bad Request`**.

---

### 🛡️ Bloque C: Códigos de Estado HTTP y Manejo de Errores
26. **¿Qué diferencia fundamental hay entre el código 401 y el código 403?**  
    - *Respuesta:*  
      - **`401 Unauthorized`** es un error de **Autenticación**: el servidor no sabe quién eres (falta la cabecera `Authorization`, o el token JWT es inválido o ha expirado).  
      - **`403 Forbidden`** es un error de **Autorización / Permisos**: el servidor **SÍ sabe quién eres** (el token es válido), pero **NO tienes permiso** para acceder o modificar ese recurso específico (por ejemplo, intentar borrar o editar una rutina o perfil que pertenece a otro usuario).
27. **¿Qué código HTTP se devuelve si se envía un JSON con campos inválidos o faltantes?**  
    - *Respuesta:* **`400 Bad Request`**.
28. **¿Qué código HTTP se devuelve si se intenta registrar un email que ya existe en la base de datos?**  
    - *Respuesta:* **`409 Conflict`**.
29. **¿Qué código HTTP se devuelve si se solicita un recurso con un ID que no existe?**  
    - *Respuesta:* **`404 Not Found`**.
30. **¿Qué código HTTP se devuelve si ocurre una excepción inesperada no controlada en el servidor?**  
    - *Respuesta:* **`500 Internal Server Error`**.

---

### ⚡ Bloque D: Node.js, Express y la API REST
31. **¿Qué middleware de Express es imprescindible para poder leer `req.body` en peticiones POST/PUT con JSON?**  
    - *Respuesta:* **`express.json()`** (antiguamente `body-parser`). Sin él, `req.body` es `undefined`.
32. **¿De qué tres formas distintas puede recibir datos una petición HTTP en Express?**  
    - *Respuesta:*  
      1. **Parámetros de ruta (`req.params`):** `/usuarios/:id` $\rightarrow$ `req.params.id`.  
      2. **Parámetros de consulta (`req.query`):** `/rutinas?page=1&q=fuerza` $\rightarrow$ `req.query.page`, `req.query.q`.  
      3. **Cuerpo de la petición (`req.body`):** JSON enviado en POST/PUT $\rightarrow$ `req.body.nombre`.
33. **¿Cuál es la firma de un middleware estándar en Express?**  
    - *Respuesta:* Tres parámetros: `(req, res, next)`.
34. **¿Qué ocurre si un middleware no responde a la petición ni llama a `next()`?**  
    - *Respuesta:* La petición HTTP se queda colgada indefinidamente esperando respuesta (*hanging request*).
35. **¿Cuál es la firma del middleware centralizado de manejo de errores en Express?**  
    - *Respuesta:* Cuatro parámetros: `(err, req, res, next)`. Debe colocarse obligatoriamente **al final de todas las rutas**.
36. **¿Cómo gestiona Express 5 las promesas asíncronas rechazadas (`async/await`)?**  
    - *Respuesta:* Express 5 captura automáticamente cualquier rechazo en un manejador `async` y lo deriva al manejador de errores sin necesidad de envolver todo en `try/catch` manual.
37. **¿Cómo determina Node.js si un proyecto usa módulos ES (`import`) o CommonJS (`require`)?**  
    - *Respuesta:* Si en `package.json` está `"type": "module"`, los archivos `.js` usan módulos ES (`import`/`export`). Si pone `"type": "commonjs"` o no está, usan CommonJS (`require()`). También puede forzarse por extensión (`.mjs` para ES, `.cjs` para CommonJS).

---

### ☁️ Bloque E: Supabase BaaS, Capa de Servicios y Row Level Security (RLS)
38. **¿Qué es Supabase y qué arquitectura representa?**  
    - *Respuesta:* Es una plataforma **BaaS** (*Backend as a Service*) construida sobre una base de datos relacional abierta **PostgreSQL**, que incluye autenticación, API generada automáticamente, Storage y seguridad RLS.
39. **¿Por qué NO se debe confiar en el código JavaScript del cliente (navegador) en un BaaS?**  
    - *Respuesta:* Porque cualquier usuario puede abrir la consola de DevTools del navegador, alterar el código JavaScript, modificar parámetros de petición o lanzar peticiones cURL saltándose las comprobaciones del frontend.
40. **¿Dónde debe residir la autorización en Supabase para ser 100% segura?**  
    - *Respuesta:* En el propio **motor de la base de datos PostgreSQL** mediante **Row Level Security (RLS)**.
41. **¿Qué sentencia SQL activa RLS en una tabla de PostgreSQL?**  
    - *Respuesta:* `ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;`
42. **¿Qué ocurre si activas RLS en una tabla y NO defines ninguna política?**  
    - *Respuesta:* Por defecto, **nadie puede leer ni escribir** ningún registro (denegación por defecto).
43. **¿Cuál es la diferencia entre las cláusulas `USING` y `WITH CHECK` en una política RLS?**  
    - *Respuesta:*  
      - **`USING`**: Se aplica para filtrar las filas existentes que se van a leer (`SELECT`), actualizar (`UPDATE`) o borrar (`DELETE`).  
      - **`WITH CHECK`**: Se aplica para validar las filas nuevas o los datos resultantes que se van a insertar (`INSERT`) o tras ser modificados (`UPDATE`).
44. **¿Qué función de Supabase en PostgreSQL devuelve el UUID del usuario autenticado?**  
    - *Respuesta:* **`auth.uid()`**.
45. **¿Qué es la "Capa de Servicios" (*Service Layer*) en Supabase y para qué sirve?**  
    - *Respuesta:* Es un módulo JavaScript (`servicios.js`) que expone funciones semánticas del dominio (`login`, `crearRutina`, `buscarRutinas`) para **aislar completamente al código cliente del SDK de Supabase**. De este modo, si en el futuro se cambia de base de datos o de BaaS, el código de las vistas no tiene que modificarse.

---

### 📚 Bloque F: Metodología SDD y Gestión del Proyecto
46. **¿Qué significan las siglas SDD en la asignatura?**  
    - *Respuesta:* **Specification-Driven Development** (Desarrollo Dirigido por Especificaciones).
47. **¿Cuál es el ciclo de trabajo estricto que debe seguirse en cada iteración SDD?**  
    - *Respuesta:*  
      $$\text{SPEC} \rightarrow \text{PLAN} \rightarrow \text{TEST\_PLAN} \rightarrow \text{CODE} \rightarrow \text{TEST} \rightarrow \text{REVIEW} \rightarrow \text{COMMIT}$$
48. **¿Qué cinco secciones obligatorias debe tener cada documento de iteración (`docs/iterations/*.md`)?**  
    - *Respuesta:*  
      1. `## SPEC` (Objetivo, requisitos y fuera de alcance).  
      2. `## PLAN` (Pasos y archivos a modificar).  
      3. `## TEST_PLAN` (Matriz de casos de prueba previstos y resultados).  
      4. `## AI_LOG` (Herramienta, modelo, prompts, qué se aceptó y qué se rechazó).  
      5. `## COMMITS RELACIONADOS` (Hashes de los commits de Git de esa iteración).
49. **¿Qué contiene el documento `PROJECT_SPEC.md`?**  
    - *Respuesta:* La descripción general del proyecto a alto nivel, usuarios objetivo, entidades principales y secundarias, y reglas de negocio, **sin entrar en tecnologías concretas**.
50. **¿Qué contiene el documento `ARCHITECTURE.md`?**  
    - *Respuesta:* Las decisiones técnicas concretas: frameworks (Express 5), base de datos (SQLite / PostgreSQL), rutas de la API REST, autenticación JWT, esquemas de tablas y capa de servicios.
51. **¿Qué contiene el documento `AI_SUMMARY.md`?**  
    - *Respuesta:* El resumen global del uso de herramientas de Inteligencia Artificial a lo largo de todo el proyecto, decisiones manuales tomadas y valoración del proceso.
52. **¿Por qué está terminantemente prohibido incluir `node_modules` en la entrega `.zip`?**  
    - *Respuesta:* Porque `node_modules` contiene miles de paquetes descargados de terceros que ocupan cientos de megabytes. La entrega debe ser ligera y las dependencias se reinstalan automáticamente con `npm install` leyendo `package.json`.
53. **¿Por qué es obligatorio incluir la carpeta oculta `.git` en la entrega?**  
    - *Respuesta:* Porque el profesor evalúa la trazabilidad del desarrollo mediante el **historial de commits local**, comprobando que cada iteración se programó y guardó paso a paso.

---

## 2. CONCEPTOS UNIVERSALES DEL EXAMEN

Independientemente de si tu proyecto es de gimnasio, recetas o películas, estos conceptos son **100% idénticos para todos los estudiantes**:

```
                                  ARQUITECTURA DUAL DE LA PRÁCTICA
                                  
       ┌───────────────────────────────────────┐   ┌──────────────────────────────────────┐
       │     BACKEND REST PROPIO (A MEDIDA)    │   │         BACKEND BAAS SUPABASE        │
       ├───────────────────────────────────────┤   ├──────────────────────────────────────┤
       │ • Servidor Express en puerto 3000     │   │ • No hay servidor Express propio     │
       │ • Rutas HTTP (/api/rutinas, etc.)     │   │ • Funciones JS en servicios.js       │
       │ • Base de datos SQLite local (.db)    │   │ • PostgreSQL gestionado en la nube   │
       │ • Autenticación JWT generada en Node  │   │ • Autenticación en Supabase Auth     │
       │ • Permisos con IF en JavaScript       │   │ • Permisos con RLS en PostgreSQL     │
       │ • Tests con peticiones HTTP (fetch)   │   │ • Tests directos a servicios.js      │
       └───────────────────────────────────────┘   └──────────────────────────────────────┘
```

---

## 3. AUTENTICACIÓN JWT Y SEGURIDAD

### Estructura del Token JWT (RFC 7519):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJpdmFuQHVhLmVzIiwibm9tYnJlIjoiSXZhbiIsImlhdCI6MTcyODIyMDAwMCwiZXhwIjoxNzI4MzA2NDAwfQ.kY3g9...
└────────────────┬─────────────────┘ └──────────────────────────────┬──────────────────────────────┘ └───────────────────┬───────────────────┘
         1. HEADER (Base64Url)                             2. PAYLOAD (Base64Url)                             3. SIGNATURE (Firma HMAC-SHA256)
         {"alg":"HS256","typ":"JWT"}                 {"id":1,"email":"ivan@ua.es",...}                 HMAC(Header.Payload, Secret)
```

### Proceso Paso a Paso:
1. **Registro (`POST /api/auth/register`):**
   - Recibe: `nombre`, `email`, `password`, `bio`.
   - Valida: email con formato válido, password $\ge 6$ caracteres, nombre $\ge 2$ caracteres.
   - Si el email ya existe $\rightarrow$ responde **`409 Conflict`**.
   - Genera Salt aleatorio (`crypto.randomBytes(16)`).
   - Calcula hash PBKDF2 (`crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256')`).
   - Inserta en SQLite y emite JWT $\rightarrow$ responde **`201 Created`**.
2. **Login (`POST /api/auth/login`):**
   - Recibe: `email`, `password`.
   - Busca usuario por email. Si no existe $\rightarrow$ **`401 Unauthorized`**.
   - Recalcula PBKDF2 con la password recibida y el salt guardado.
   - Compara con `crypto.timingSafeEqual()`. Si no coincide $\rightarrow$ **`401 Unauthorized`**.
   - Emite JWT $\rightarrow$ responde **`200 OK`** con `{ token, usuario }`.
3. **Petición Protegida:**
   - Cliente envía cabecera: `Authorization: Bearer <token>`.
   - Middleware `authenticateToken` extrae el token, verifica firma y fecha (`verifyJWT()`).
   - Si todo es correcto, inyecta `req.usuario` y llama a `next()`.

---

## 4. RECURSO PRINCIPAL Y SECUNDARIO

### Tabla de Operaciones CRUD y Códigos HTTP:

| Operación | Método HTTP | Ruta | Seguridad / Permiso | Código Éxito | Códigos Error |
|---|---|---|---|:---:|:---:|
| **Crear Rutina** | `POST` | `/api/rutinas` | Requiere JWT | **`201 Created`** (+ Location) | `400`, `401` |
| **Listar Rutinas** | `GET` | `/api/rutinas` | Opcional (filtro público/privado) | **`200 OK`** (Paginado) | - |
| **Detalle Rutina** | `GET` | `/api/rutinas/:id` | Opcional si es pública, privada solo dueño | **`200 OK`** (+ ejercicios JOIN) | `400`, `403`, `404` |
| **Modificar Rutina** | `PUT` | `/api/rutinas/:id` | **Solo dueño** (`req.usuario.id == usuario_id`) | **`200 OK`** | `400`, `401`, `403`, `404` |
| **Eliminar Rutina** | `DELETE` | `/api/rutinas/:id` | **Solo dueño** | **`204 No Content`** | `400`, `401`, `403`, `404` |
| **Listar Catálogo** | `GET` | `/api/ejercicios` | Pública | **`200 OK`** | - |
| **Crear Ejercicio** | `POST` | `/api/ejercicios` | Requiere JWT | **`201 Created`** | `400`, `401` |
| **Listar en Rutina** | `GET` | `/api/rutinas/:id/ejercicios` | Misma visibilidad que la rutina | **`200 OK`** | `400`, `403`, `404` |
| **Asignar a Rutina** | `POST` | `/api/rutinas/:id/ejercicios` | **Solo dueño de la rutina** | **`201 Created`** | `400`, `401`, `403`, `404` |
| **Quitar de Rutina** | `DELETE` | `/api/rutinas/:id/ejercicios/:id_asig` | **Solo dueño de la rutina** | **`204 No Content`** | `400`, `401`, `403`, `404` |

---

## 5. CÓDIGOS DE ESTADO HTTP Y CABECERAS REST

* **`200 OK`**: Petición atendida con éxito y datos devueltos.
* **`201 Created`**: Creación exitosa. **Debe incluir cabecera `Location: /ruta/nuevo_id`**.
* **`204 No Content`**: Acción ejecutada con éxito (típicamente `DELETE`) que no devuelve contenido en el cuerpo.
* **`400 Bad Request`**: Datos de entrada incorrectos (faltan campos obligatorios, nombre demasiado corto, series $\le 0$).
* **`401 Unauthorized`**: Falta autenticación o token inválido/expirado (*"No sé quién eres"*).
* **`403 Forbidden`**: Autenticado pero sin privilegios suficientes (*"Sé quién eres, pero no es tuyo"*).
* **`404 Not Found`**: El recurso con ese ID no existe en la base de datos o la ruta no existe.
* **`409 Conflict`**: Conflicto de estado (típicamente intentar registrar un email que ya existe en la BD).
* **`500 Internal Server Error`**: Excepción no controlada en el servidor.

---

## 6. NODE.JS Y EXPRESS 5

* **Módulo nativo `node:sqlite`:** Permite usar SQLite sincrónico de alto rendimiento (`DatabaseSync`) nativo en Node 24 sin depender de paquetes compilados con `node-gyp`.
* **Middlewares globales en `app.js`:**
  - `cors()`: Permite llamadas desde orígenes cruzados.
  - `express.json()`: Parsea el cuerpo JSON y lo deja disponible en `req.body`.
  - Endpoint `/api/health`: Monitorización del estado del backend.
  - Middleware 404 al final: Captura rutas no registradas.
  - Middleware de errores `(err, req, res, next)`: Captura excepciones y evita que el proceso muera.

---

## 7. SUPABASE BAAS, CAPA DE SERVICIOS Y ROW LEVEL SECURITY (RLS)

### Reglas RLS en `schema.sql`:
```sql
-- 1. Rutinas: Cualquier usuario ve las públicas; las privadas solo su dueño
CREATE POLICY "Lectura de rutinas publicas o propias"
ON public.rutinas FOR SELECT
USING (es_publica = true OR auth.uid() = usuario_id);

-- 2. Rutinas: Solo el usuario autenticado crea rutinas a su nombre
CREATE POLICY "Crear rutinas propias"
ON public.rutinas FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- 3. Rutinas: Solo el propietario actualiza su rutina
CREATE POLICY "Actualizar rutinas propias"
ON public.rutinas FOR UPDATE
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- 4. Rutinas: Solo el propietario elimina su rutina
CREATE POLICY "Borrar rutinas propias"
ON public.rutinas FOR DELETE
USING (auth.uid() = usuario_id);
```

### Funciones de la Capa de Servicios en `servicios.js`:
- `registro()`, `login()`, `logout()`, `getUsuarioActual()`, `getPerfil()`, `updatePerfil()`.
- `crearRutina()`, `buscarRutinas()`, `getRutinaConEjercicios()`, `updateRutina()`, `borrarRutina()`.
- `getEjercicios()`, `crearEjercicio()`, `addEjercicioARutina()`, `borrarEjercicioDeRutina()`.

---

## 8. METODOLOGÍA SDD Y DOCUMENTACIÓN

* **Significado:** Specification-Driven Development.
* **Documentos Generales:**
  - `docs/PROJECT_SPEC.md`: Alcance, usuarios, problema de negocio, entidades comunes.
  - `docs/ARCHITECTURE.md`: Decisiones técnicas, rutas REST, esquemas SQLite/PostgreSQL y capa de servicios.
  - `docs/AI_SUMMARY.md`: Registro transparente del uso de IA y decisiones de diseño.
* **Estructura obligatoria por iteración:**
  - `## SPEC`: Requisitos funcionales, técnicos y fuera de alcance.
  - `## PLAN`: Pasos concretos de desarrollo y archivos a tocar.
  - `## TEST_PLAN`: Matriz de pruebas manuales y automáticas (resultado esperado vs obtenido).
  - `## AI_LOG`: Herramientas utilizadas (Antigravity / Gemini), prompts y decisiones.
  - `## COMMITS RELACIONADOS`: Hashes de Git reales vinculados.

---

## 9. FICHA RESUMEN DE TUS 5 ITERACIONES Y COMMITS

| Iteración | Documento en `docs/iterations/` | Commit Hash | Qué se implementó |
|:---:|---|:---:|---|
| **01** | `01-setup-y-arquitectura.md` | `9fbdfa6` | Setup del proyecto, configuración Express 5, persistencia SQLite (`node:sqlite`) con tablas relacionales y `/api/health`. |
| **02** | `02-backend-rest-auth-usuarios.md` | `fc120b6` | Autenticación JWT (`HS256`), hashing PBKDF2 con Salt aleatorio de 16 bytes, registro, login y perfiles protegidos (`403` a terceros). |
| **03** | `03-backend-rest-rutinas-crud-paginacion.md` | `62f3356` | CRUD de Rutinas, paginación (`LIMIT/OFFSET`), búsqueda `?q=`, detalle anidando ejercicios (`JOIN`) y rutinas privadas protegidas. |
| **04** | `04-backend-rest-ejercicios-rutina.md` | `cce8c60` | Catálogo de ejercicios, asignación a rutinas validando series/reps $> 0$ (o da `400`), control de dueño y borrado (`204`). |
| **05** | `05-backend-supabase-capa-servicios.md` | `21a7161` | Segundo Backend (Supabase BaaS): DDL PostgreSQL, políticas RLS en `schema.sql`, capa de servicios en `servicios.js` y tests. |

---

## 10. PREGUNTAS TRAMPA FRECUENTES EN ADI

1. **"¿Por qué en tu entrega no hay archivos .html ni .css?"**  
   *Respuesta:* Porque el enunciado de la Práctica 1 prohíbe taxativamente escribir código frontend (*"TODAVÍA NO SE DEBE ESCRIBIR NADA DE CÓDIGO DEL FRONTEND"*). El backend se valida mediante tests automatizados y peticiones HTTP.
2. **"¿En qué se diferencian 401 y 403?"**  
   *Respuesta:* 401 es fallo de **autenticación** (token ausente o caducado); 403 es fallo de **autorización** (usuario autenticado correctamente pero intentando tocar datos ajenos).
3. **"¿Por qué se necesita `express.json()`?"**  
   *Respuesta:* Porque las peticiones HTTP llegan como streams binarios. `express.json()` parsea el cuerpo cuando la cabecera es `Content-Type: application/json` y lo coloca en `req.body`.
4. **"¿Dónde reside la seguridad en Supabase?"**  
   *Respuesta:* En el **motor de la base de datos PostgreSQL** mediante **Row Level Security (RLS)**, nunca en el código cliente JavaScript.
5. **"¿Por qué la entrega no incluye `node_modules`?"**  
   *Respuesta:* Porque son librerías externas que ocupan mucho espacio y se reinstalan al instante con `npm install` leyendo `package.json`.
