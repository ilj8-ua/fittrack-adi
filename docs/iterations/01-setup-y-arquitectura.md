# Iteración 01 - Setup del Proyecto, Arquitectura y Modelo de Datos

## SPEC

### Objetivo
Establecer la estructura base del proyecto, configurar los módulos de Node.js, definir el esquema de base de datos SQLite para el backend REST y preparar la infraestructura inicial de desarrollo y pruebas.

### Requisitos Funcionales y Técnicos
- Configurar el repositorio local de Git con `.gitignore` para omitir `node_modules` y ficheros temporales.
- Crear los directorios `backend-rest` y `backend-supabase`.
- Inicializar `package.json` en `backend-rest` con `"type": "module"`, scripts `start`, `dev` y `test`.
- Instalar dependencias necesarias (`express`, `cors`).
- Implementar el módulo de base de datos `backend-rest/src/db/database.js` usando `node:sqlite` para inicializar automáticamente las tablas relacionales (`usuarios`, `ejercicios`, `rutinas`, `rutina_ejercicios`) con soporte de claves foráneas (`PRAGMA foreign_keys = ON;`).
- Implementar la configuración base `backend-rest/src/config.js` y la instancia de Express en `backend-rest/src/app.js`.
- Configurar script de inicio y comprobación de salud del servidor (`GET /api/health`).

### Fuera de Alcance
- Implementación de la lógica de autenticación JWT y rutas de usuarios (Iteración 02).
- Implementación del CRUD de rutinas y ejercicios (Iteraciones 03 y 04).
- Implementación de la capa de servicios Supabase (Iteración 05).

## PLAN

1. Crear estructura de carpetas `backend-rest/src/{db,middleware,routes}`, `backend-rest/data`, `backend-rest/tests`.
2. Crear `backend-rest/package.json` con dependencias mínimas requeridas.
3. Instalar dependencias con `npm.cmd install`.
4. Crear `backend-rest/src/config.js` definiendo puerto, ruta de base de datos SQLite y clave secreta JWT.
5. Crear `backend-rest/src/db/database.js` con la función `initDB(dbPath)` que crea las tablas relacionales y opcionalmente inserta un catálogo inicial de ejercicios.
6. Crear `backend-rest/src/app.js` configurando middlewares estándar (express.json, cors, logging) y endpoint de salud `/api/health`.
7. Crear `backend-rest/src/server.js` para arrancar el servidor en modo standalone.
8. Crear test inicial de verificación en `backend-rest/tests/setup.test.js`.

## TEST_PLAN

| Caso | Resultado Esperado | Resultado Obtenido |
|---|---|---|
| Inicialización de la base de datos | Crea las tablas `usuarios`, `rutinas`, `ejercicios`, `rutina_ejercicios` sin errores | Correcto |
| Petición `GET /api/health` | Devuelve status 200 y JSON `{ status: 'ok', app: 'FitTrack API' }` | Correcto |
| Integridad referencial SQLite | Claves foráneas activadas correctamente | Correcto |

### Tests automáticos
- `backend-rest/tests/setup.test.js`: Comprueba la inicialización de la base de datos y la respuesta del endpoint de salud.

## AI_LOG

### Herramienta usada
- Herramienta: Antigravity
- Modelo: Gemini 3.7 Flash

### Uso realizado
- Propuesta de estructura del proyecto y partición modular.
- Generación de scripts DDL de SQLite con tipos de datos correctos e índices.
- Creación de archivos base de configuración y servidor Express.

### Decisiones
- Se utilizó `node:sqlite` para garantizar rendimiento nativo y compatibilidad total con Node 24 sin depender de binarios externos compilados.
- Se configuró la base de datos para admitir modo en memoria (`:memory:`) durante tests automatizados y fichero persistente en disco (`data/fittrack.db`) para ejecución normal.

## COMMITS RELACIONADOS

- Pendiente de asignación tras el commit de la iteración.
