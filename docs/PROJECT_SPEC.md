# PROJECT_SPEC - FitTrack

## Descripción del Proyecto

**FitTrack** es una plataforma web para la planificación, registro y seguimiento de entrenamientos de fuerza y acondicionamiento físico. Permite a los usuarios crear sus propias rutinas de entrenamiento estructuradas con ejercicios y objetivos específicos, buscar y consultar rutinas públicas populares creadas por otros miembros de la comunidad, gestionar perfiles de usuario y seguir su progreso.

El objetivo principal es resolver la dispersión de información y la falta de seguimiento sistemático que sufren los usuarios en sus planes de entrenamiento mediante una arquitectura limpia y desacoplada, exponiendo tanto una API REST profesional como una capa de servicios BaaS (Supabase).

## Usuario Objetivo

- Deportistas y aficionados al fitness que buscan estructurar y registrar sus rutinas.
- Entrenadores personales que desean compartir y publicar plantillas de entrenamiento para la comunidad.

## Recurso Principal

- **Rutinas (`rutinas`)**: Representa un plan o sesión estructurada de entrenamiento (ej. "Torso-Pierna Hipertrofia", "Full Body Fuerza"). Contiene metadatos como nombre, descripción, nivel de dificultad, si es pública/compartida y el usuario propietario/creador.

## Recursos Secundarios y Relacionados

- **Usuarios (`usuarios`)**: Cuentas registradas en el sistema con credenciales seguras, nombre y fecha de registro.
- **Ejercicios (`ejercicios`)**: Catálogo de ejercicios disponibles (ej. "Press de banca", "Sentadilla trasera", "Dominadas") con grupo muscular y equipamiento requerido.
- **Rutina-Ejercicios (`rutina_ejercicios`)**: Asignación de ejercicios específicos a una rutina concreta, definiendo número de series objetivo, repeticiones objetivo y orden de ejecución.

## Relaciones

- `Usuario -> Rutina` (1:N): Un usuario puede crear múltiples rutinas; cada rutina pertenece a un único usuario creador.
- `Usuario -> Ejercicio` (1:N opcional): Un usuario puede dar de alta ejercicios personalizados en el catálogo.
- `Rutina -> RutinaEjercicio` (1:N): Una rutina contiene múltiples asignaciones de ejercicios con sus objetivos de series/repeticiones.
- `Ejercicio -> RutinaEjercicio` (1:N): Un mismo ejercicio del catálogo puede estar presente en múltiples rutinas.

## Funcionalidades Principales

### 1. Gestión de Usuarios y Autenticación
- Registro de nuevo usuario (nombre, email y contraseña cifrada).
- Autenticación segura mediante tokens JWT.
- Consulta del perfil de usuario.
- Edición del perfil de usuario (restringido estrictamente al propio usuario autenticado).

### 2. Gestión de Rutinas (Recurso Principal)
- Creación de una nueva rutina asociada al usuario autenticado.
- Listado paginado de rutinas con capacidad de búsqueda por texto (nombre/descripción) y filtrado por visibilidad (públicas) o nivel.
- Consulta detallada de una rutina por su identificador junto con su recurso secundario anidado (los ejercicios asignados con sus series y repeticiones).
- Modificación de los datos de una rutina (solo permitida al usuario creador).
- Eliminación de una rutina (solo permitida al usuario creador).

### 3. Gestión de Ejercicios y Asignaciones (Recurso Secundario)
- Consulta del catálogo global de ejercicios disponibles.
- Creación de nuevos ejercicios en el catálogo.
- Asignación de un ejercicio a una rutina indicando series objetivo y repeticiones objetivo (solo propietario de la rutina).
- Listado de ejercicios asignados a una rutina específica.
- Eliminación/desasignación de un ejercicio de una rutina (solo propietario de la rutina).

## Validaciones y Reglas de Acceso

- **Validación de entradas**: Nombre de rutina obligatorio y no vacío (longitud mínima 3 caracteres), series objetivo y repeticiones objetivo deben ser enteros positivos (> 0), formato de email válido, contraseña de al menos 6 caracteres.
- **Control de acceso**:
  - Rutinas públicas visibles para cualquier usuario o visitante.
  - Rutinas privadas visibles y accesibles únicamente por su creador.
  - La edición y borrado de rutinas y la asignación/eliminación de sus ejercicios requiere obligatoriamente que el usuario autenticado sea el creador.

## Fuera de Alcance (v1.0 - Backend Inicial)

- Analíticas avanzadas con modelos de IA predictivos.
- Generación automática de planes nutricionales.
- Pasarela de pago o suscripciones premium.
- Interfaz gráfica de usuario (HTML/CSS en el navegador - planificado para prácticas posteriores).
