# AI_SUMMARY - FitTrack (Práctica 1)

## Herramientas y Modelos Utilizados

- **Asistente Principal**: Antigravity (Gemini 3.7 Flash)
- **Entorno de Ejecución**: Node.js v24.15.0 LTS en Windows 11, PowerShell, Git

## Uso Principal de la IA

1. **Estructuración y Planificación**:
   - Análisis detallado del diseño previo en **Práctica 0** (FitTrack - Iván Lafont Jabazin) y de los requerimientos del enunciado de la Práctica 1.
   - Definición de las especificaciones globales (`PROJECT_SPEC.md` y `ARCHITECTURE.md`) y partición del desarrollo en 5 iteraciones siguiendo estrictamente la metodología **SDD** (*Specification-Driven Development*).
2. **Generación de Código Backend REST (`backend-rest`)**:
   - Implementación modular con Express 5 de endpoints de autenticación, usuarios, rutinas (recurso principal) y ejercicios (recurso secundario).
   - Generación de utilidades de seguridad con `node:crypto` para hashing PBKDF2/SHA-256 con salt único y firma/verificación de tokens JWT.
   - Configuración de persistencia SQLite mediante `node:sqlite` con inicialización automática de esquema relacional y sembrado de catálogo.
3. **Generación del Segundo Backend Supabase (`backend-supabase`)**:
   - Generación del script DDL PostgreSQL `schema.sql` con definición completa de restricciones de integridad y políticas **Row Level Security (RLS)** para control de acceso en base de datos.
   - Creación de la capa de servicios `servicios.js` que aísla al cliente del SDK de Supabase.
4. **Generación de Pruebas Automatizadas**:
   - Creación de suites de tests de integración unitaria y HTTP con `node:test` y `node:assert/strict` cubriendo validación de datos, paginación, filtros de búsqueda, seguridad y control de permisos (34 tests en total).

## Decisiones y Modificaciones Relevantes

- **Persistencia en Node 24**: Se aprovechó el motor nativo `node:sqlite` para garantizar la persistencia de datos en fichero (`data/fittrack.db`) y compatibilidad instantánea en pruebas (`:memory:`), evitando dependencias con compilación C++ propensas a fallos en entornos Windows.
- **Doble Backend**: Para aspirar a la calificación máxima de 10 puntos (7 puntos mínimos + 3 puntos de requerimiento adicional), se desarrollaron ambos backends en subproyectos independientes (`backend-rest` y `backend-supabase`).
- **Seguridad en Rutas y Políticas**:
  - Rutinas públicas accesibles por cualquier usuario (incluso anónimos).
  - Rutinas privadas restringidas únicamente a su creador.
  - Edición y eliminación de perfiles, rutinas y ejercicios asignados protegidas por comprobación de identidad en JWT (REST) y políticas RLS (Supabase).

## Historial de Commits del Proyecto

- `9fbdfa6` - Iteración 01: Setup del proyecto, arquitectura y base de datos SQLite
- `fc120b6` - Iteración 02: Autenticación JWT y gestión de perfiles de usuario
- `62f3356` - Iteración 03: CRUD de Rutinas, paginación, filtros de búsqueda y permisos de acceso
- `cce8c60` - Iteración 04: Recurso secundario de ejercicios y asignación a rutinas
- `21a7161` - Iteración 05: Segundo Backend con Supabase BaaS, capa de servicios, esquema RLS y pruebas

## Valoración del Proceso SDD

El ciclo `SPEC -> PLAN -> TEST_PLAN -> CODE -> TEST -> REVIEW -> COMMIT` demostró ser altamente efectivo para asegurar que cada funcionalidad cumpliera rigurosamente sus especificaciones antes de avanzar a la siguiente etapa, manteniendo el código limpio, bien probado y documentado.
