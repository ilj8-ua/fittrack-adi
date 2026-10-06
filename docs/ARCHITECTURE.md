# ARCHITECTURE - FitTrack

## Visión General de la Arquitectura

Para dar respuesta a los requisitos de la Práctica 1 y alcanzar la máxima puntuación (10/10), el sistema se estructura en dos proyectos de backend independientes que implementan el modelo de datos de FitTrack:

1. **Backend REST Propio (`backend-rest`)**: Desarrollado con Node.js, Express y SQLite persistente. Expone un API REST JSON autenticado mediante tokens JWT emitidos con firma HMAC SHA-256.
2. **Backend BaaS Supabase (`backend-supabase`)**: Implementado sobre Supabase (PostgreSQL), aislando la infraestructura mediante una capa de servicios en JavaScript y aplicando autorización en base de datos mediante políticas Row Level Security (RLS).

```
Práctica/
├── docs/                      # Documentación SDD global e iteraciones
│   ├── PROJECT_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── AI_SUMMARY.md
│   └── iterations/
├── backend-rest/              # Backend 1: API REST con Node.js + Express + SQLite
│   ├── package.json
│   ├── src/
│   │   ├── config.js          # Configuración y variables de entorno
│   │   ├── app.js             # Configuración de Express y middlewares
│   │   ├── server.js          # Entrada de servidor HTTP
│   │   ├── db/database.js     # Inicialización y persistencia SQLite
│   │   ├── middleware/        # Autenticación JWT, validaciones y errores
│   │   └── routes/            # Controladores y rutas REST
│   └── tests/                 # Suite de pruebas automatizadas con node:test
└── backend-supabase/          # Backend 2: Capa de servicios sobre Supabase BaaS
    ├── package.json
    ├── schema.sql             # DDL PostgreSQL + RLS Policies
    ├── src/
    │   ├── supabaseClient.js  # Inicialización del cliente Supabase SDK
    │   └── servicios.js       # Capa de servicios desacoplada
    └── tests/
        └── servicios.test.js  # Pruebas automatizadas de la capa de servicios
```

---

## 1. Backend REST (`backend-rest`)

- **Plataforma**: Node.js (Módulos ES6 - `"type": "module"`).
- **Framework Web**: Express 5.
- **Base de Datos**: SQLite persistente (`data/fittrack.db`) mediante el motor nativo `node:sqlite` (ultrarrápido, sin dependencias nativas complejas que puedan fallar en compilación, y con almacenamiento persistente en disco garantizado).
- **Autenticación**: JSON Web Tokens (JWT) con expiración configurable y middleware de verificación `Bearer <token>`.
- **Cifrado de contraseñas**: Hashing seguro mediante SHA-256 con Salt aleatorio único por usuario (`node:crypto` / estándar de seguridad).
- **Pruebas Automatizadas**: Suite completa de tests de integración HTTP utilizando `node:test` y `node:assert/strict`.

### Modelo Relacional de Tablas (SQLite)

#### `usuarios`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `nombre` TEXT NOT NULL
- `email` TEXT UNIQUE NOT NULL
- `password_hash` TEXT NOT NULL
- `salt` TEXT NOT NULL
- `fecha_registro` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP

#### `ejercicios`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `nombre` TEXT NOT NULL
- `grupo_muscular` TEXT NOT NULL
- `equipamiento` TEXT NOT NULL
- `creador_id` INTEGER REFERENCES usuarios(id) ON DELETE SET NULL

#### `rutinas`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `usuario_id` INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE
- `nombre` TEXT NOT NULL
- `descripcion` TEXT NOT NULL
- `nivel` TEXT NOT NULL DEFAULT 'intermedio'
- `es_publica` INTEGER NOT NULL DEFAULT 1
- `fecha_creacion` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP

#### `rutina_ejercicios`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `rutina_id` INTEGER NOT NULL REFERENCES rutinas(id) ON DELETE CASCADE
- `ejercicio_id` INTEGER NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE
- `series_objetivo` INTEGER NOT NULL CHECK (series_objetivo > 0)
- `repeticiones_objetivo` INTEGER NOT NULL CHECK (repeticiones_objetivo > 0)
- `orden` INTEGER NOT NULL DEFAULT 1

### Rutas de la API REST

Prefijo global: `/api`

| Método | Ruta | Descripción | Autenticación requerida |
|---|---|---|---|
| `POST` | `/api/auth/register` | Registro de usuario | No |
| `POST` | `/api/auth/login` | Inicio de sesión (retorna token JWT y usuario) | No |
| `GET` | `/api/usuarios/:id` | Consulta de perfil de usuario | Opcional / Pública |
| `PUT` | `/api/usuarios/:id` | Edición del perfil propio | Sí (Solo el propio usuario) |
| `POST` | `/api/rutinas` | Crear nueva rutina | Sí (Asigna `usuario_id` del token) |
| `GET` | `/api/rutinas` | Listar rutinas paginadas (filtro `q`, `es_publica`, `page`, `limit`) | Opcional (Públicas + propias si está logueado) |
| `GET` | `/api/rutinas/:id` | Detalle de rutina con sus ejercicios anidados | Opcional si es pública, sí si es privada |
| `PUT` | `/api/rutinas/:id` | Modificar rutina | Sí (Solo propietario) |
| `DELETE` | `/api/rutinas/:id` | Eliminar rutina | Sí (Solo propietario) |
| `GET` | `/api/ejercicios` | Listar catálogo de ejercicios | No |
| `POST` | `/api/ejercicios` | Crear ejercicio en catálogo | Sí |
| `GET` | `/api/rutinas/:id/ejercicios` | Listar ejercicios asignados a una rutina | Opcional si es pública, sí si es privada |
| `POST` | `/api/rutinas/:id/ejercicios` | Asignar ejercicio a rutina con series/repeticiones | Sí (Solo propietario de rutina) |
| `DELETE` | `/api/rutinas/:id/ejercicios/:id_ejercicio_rutina` | Quitar ejercicio de una rutina | Sí (Solo propietario de rutina) |

---

## 2. Backend Supabase (`backend-supabase`)

- **Plataforma**: Supabase BaaS (PostgreSQL gestionado).
- **SDK**: `@supabase/supabase-js`.
- **Capa de Servicios**: Módulo `servicios.js` que encapsula la lógica de negocio y las llamadas a Supabase Auth y Supabase DB, abstrayendo al futuro frontend de los detalles de la infraestructura.
- **Autorización y Seguridad**: Políticas Row Level Security (RLS) en PostgreSQL:
  - Políticas de lectura pública para rutinas con `es_publica = true`.
  - Políticas de lectura restringida al creador para rutinas privadas (`auth.uid() = usuario_id`).
  - Políticas de inserción, actualización y borrado restringidas al propietario del registro (`auth.uid() = usuario_id`).
- **Pruebas Automatizadas**: Suite de tests automatizados que validan la capa de servicios, parámetros, validaciones de negocio y manejo de errores.
