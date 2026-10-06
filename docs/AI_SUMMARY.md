# AI_SUMMARY - FitTrack (Práctica 1)

## Herramientas y Modelos Utilizados

- **Asistente Principal**: Antigravity (Gemini 3.7 Flash)
- **Entorno de Desarrollo**: Node.js v24.15.0 en Windows, Git, PowerShell

## Uso Principal de la IA

1. **Estructuración y Planificación**:
   - Definición de especificaciones técnicas a partir de la Práctica 0 (FitTrack) y el enunciado de la Práctica 1.
   - Diseño de las iteraciones siguiendo estrictamente la metodología SDD (*Specification-Driven Development*).
2. **Generación de Código Backend**:
   - Implementación de la API REST en Node/Express con arquitectura modular (rutas, middlewares, base de datos SQLite y autenticación JWT).
   - Implementación de la capa de servicios sobre Supabase (`backend-supabase`) y definición del esquema SQL con RLS.
3. **Generación de Pruebas Automatizadas**:
   - Diseño de suites de pruebas automáticas completas para verificar cada caso de uso, validaciones y permisos.
4. **Documentación del Proceso**:
   - Creación y mantenimiento de los documentos de iteración (`docs/iterations/`).

## Decisiones y Modificaciones Manuales

- **Elección del motor de persistencia**: Se optó por `node:sqlite` nativo en Node 24 para garantizar portabilidad sin compilación de binarios C++ complejos en Windows y persistencia en fichero `fittrack.db`.
- **Estructura desacoplada en dos proyectos**: Para cumplir con la opción de 10 puntos de forma clara y limpia, se organizó el repositorio en `backend-rest` y `backend-supabase`.
- **Validaciones exhaustivas**: Se incluyeron validaciones de tipos, campos obligatorios y rangos positivos para series y repeticiones.
- **Seguridad en perfiles**: Se aseguró que un usuario solo pueda modificar su propio perfil y sus propias rutinas, retornando los códigos HTTP estándar (400, 401, 403, 404).

## Valoración del Proceso SDD

La metodología SDD ha permitido mantener un alcance claro en cada paso (`SPEC -> PLAN -> TEST_PLAN -> CODE -> TEST -> REVIEW -> COMMIT`), asegurando que ninguna funcionalidad quede sin probar o fuera de las especificaciones iniciales.
