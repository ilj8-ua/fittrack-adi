# FitTrack - Práctica 1: Desarrollo del Backend

**Asignatura**: Arquitectura y Desarrollo de Sistemas de Información (ADI)  
**Estudiante**: Iván Lafont Jabazin (ilj8) - 51235963J  
**Metodología**: SDD (*Specification-Driven Development*)

---

## 📌 Descripción del Proyecto

**FitTrack** es una plataforma web para la planificación, registro y monitorización de entrenamientos de fuerza. Permite a los usuarios crear y personalizar sus propias rutinas, explorar y clonar rutinas públicas de la comunidad, gestionar perfiles de usuario con autenticación segura y organizar ejercicios con objetivos de series y repeticiones.

En esta Práctica 1 se ha desarrollado la arquitectura de backend completa cumpliendo los requerimientos mínimos y el requerimiento adicional para la máxima puntuación (10/10), implementando **ambos tipos de backend**:

1. **Backend REST Propio (`backend-rest`)**: API REST construida con **Node.js**, **Express 5**, persistencia en base de datos **SQLite** (`node:sqlite`) y autenticación basada en **JWT** (JSON Web Tokens) con contraseñas cifradas y salt individual.
2. **Backend BaaS Supabase (`backend-supabase`)**: Capa de servicios desacoplada construida sobre **Supabase (PostgreSQL)**, con definición completa de esquemas DDL y políticas de seguridad **Row Level Security (RLS)**.

---

## 📂 Estructura del Repositorio

```
Práctica/
├── package.json                         # Scripts globales unificados
├── .gitignore                           # Exclusión de node_modules y ficheros sensibles
├── README.md                            # Documentación principal del proyecto
├── docs/                                # Documentación formal SDD
│   ├── PROJECT_SPEC.md                  # Especificación global de FitTrack
│   ├── ARCHITECTURE.md                  # Decisiones de arquitectura y diseño técnico
│   ├── AI_SUMMARY.md                    # Registro del uso de IA en el desarrollo
│   └── iterations/                      # Documentación por cada iteración SDD
│       ├── 01-setup-y-arquitectura.md
│       ├── 02-backend-rest-auth-usuarios.md
│       ├── 03-backend-rest-rutinas-crud-paginacion.md
│       ├── 04-backend-rest-ejercicios-rutina.md
│       └── 05-backend-supabase-capa-servicios.md
├── backend-rest/                        # PROYECTO 1: Backend REST a medida
│   ├── package.json
│   ├── src/
│   │   ├── config.js                    # Variables de entorno y configuración
│   │   ├── server.js                    # Servidor HTTP
│   │   ├── app.js                       # Aplicación Express y middlewares
│   │   ├── db/database.js               # Persistencia SQLite y semillas
│   │   ├── middleware/auth.js           # Middleware de verificación JWT
│   │   ├── utils/security.js            # Hashing seguro y generación JWT
│   │   └── routes/                      # Controladores de rutas REST
│   │       ├── auth.js                  # /api/auth (register, login)
│   │       ├── usuarios.js              # /api/usuarios (ver, editar perfil)
│   │       ├── rutinas.js               # /api/rutinas (CRUD, paginación, filtros)
│   │       └── ejercicios.js            # /api/ejercicios (catálogo)
│   └── tests/                           # Tests automatizados (node:test)
│       ├── setup.test.js
│       ├── auth_usuarios.test.js
│       ├── rutinas.test.js
│       └── ejercicios_rutina.test.js
└── backend-supabase/                    # PROYECTO 2: Backend BaaS Supabase
    ├── package.json
    ├── schema.sql                       # DDL PostgreSQL + Políticas RLS
    ├── src/
    │   ├── config.js
    │   ├── supabaseClient.js            # Cliente Supabase SDK
    │   └── servicios.js                 # Capa de servicios desacoplada
    └── tests/
        └── servicios.test.js            # Tests de la capa de servicios
```

---

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js versión 24 LTS o superior.
- npm.

### 1. Ejecutar las pruebas automatizadas
Para lanzar todas las pruebas automáticas de ambos backends en un único comando:

```bash
npm test
```

O para ejecutarlas por separado:

```bash
# Pruebas del Backend REST
npm run test:rest

# Pruebas del Backend Supabase
npm run test:supabase
```

### 2. Arrancar el Servidor REST
Para iniciar el servidor del backend REST en `http://localhost:3000`:

```bash
# Modo normal
npm run start:rest

# Modo desarrollo (con recarga automática --watch)
npm run dev:rest
```

---

## 📖 Resumen de Endpoints de la API REST

Prefijo global: `/api`

### Autenticación y Usuarios
- `POST /api/auth/register` - Registro de usuario (`nombre`, `email`, `password`, `bio`).
- `POST /api/auth/login` - Inicio de sesión (devuelve token JWT y datos de usuario).
- `GET /api/usuarios/:id` - Consulta de perfil público.
- `PUT /api/usuarios/:id` - Edición del perfil propio (requiere `Bearer <token>`, restringido al propio usuario).

### Recurso Principal: Rutinas
- `POST /api/rutinas` - Crear rutina (`nombre`, `descripcion`, `nivel`, `es_publica`). Requiere autenticación.
- `GET /api/rutinas` - Listado paginado con filtros (`?page=1&limit=10&q=pecho&nivel=intermedio`).
- `GET /api/rutinas/:id` - Detalle de rutina con sus ejercicios asociados anidados.
- `PUT /api/rutinas/:id` - Modificar rutina (solo el creador).
- `DELETE /api/rutinas/:id` - Eliminar rutina (solo el creador).

### Recurso Secundario: Ejercicios
- `GET /api/ejercicios` - Catálogo global de ejercicios (`?grupo_muscular=Pecho`).
- `POST /api/ejercicios` - Añadir ejercicio al catálogo (requiere autenticación).
- `GET /api/rutinas/:id/ejercicios` - Listar ejercicios asignados a una rutina.
- `POST /api/rutinas/:id/ejercicios` - Asignar ejercicio a una rutina con series y repeticiones objetivo (solo el creador de la rutina).
- `DELETE /api/rutinas/:id/ejercicios/:id_ejercicio_rutina` - Desasignar ejercicio de una rutina (solo el creador de la rutina).

---

## 🛡️ Capa de Servicios y RLS en Supabase

El módulo `backend-supabase/src/servicios.js` proporciona una interfaz de alto nivel que encapsula las operaciones con Supabase:
- `registro()`, `login()`, `logout()`, `getUsuarioActual()`, `getPerfil()`, `updatePerfil()`.
- `crearRutina()`, `buscarRutinas()`, `getRutinaConEjercicios()`, `updateRutina()`, `borrarRutina()`.
- `getEjercicios()`, `crearEjercicio()`, `addEjercicioARutina()`, `borrarEjercicioDeRutina()`.

El fichero `backend-supabase/schema.sql` contiene las directivas SQL completas para PostgreSQL con activación de **Row Level Security** y políticas de acceso para cada tabla.

---

## 📝 Registro de Iteraciones SDD

1. **Iteración 01**: Setup del proyecto, arquitectura y base de datos SQLite (`docs/iterations/01-setup-y-arquitectura.md`).
2. **Iteración 02**: Autenticación JWT y gestión de perfiles de usuario (`docs/iterations/02-backend-rest-auth-usuarios.md`).
3. **Iteración 03**: CRUD de Rutinas, paginación, filtros y permisos de acceso (`docs/iterations/03-backend-rest-rutinas-crud-paginacion.md`).
4. **Iteración 04**: Recurso secundario de ejercicios y asignación a rutinas (`docs/iterations/04-backend-rest-ejercicios-rutina.md`).
5. **Iteración 05**: Segundo backend con Supabase BaaS, capa de servicios y esquema RLS (`docs/iterations/05-backend-supabase-capa-servicios.md`).
