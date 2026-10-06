# Frontend mínimo: lista de la compra

Complemento de la [práctica de introducción a Supabase](https://github.com/ottocol/ADI_26_27/blob/main/practicas/guiadas/intro_supabase.md). Usa HTML, CSS, JavaScript estándar y el SDK oficial de Supabase. No necesita un framework, npm ni compilación.

## Ponerlo en marcha

1. Completa la práctica: tabla `lista`, usuario de prueba y políticas RLS de `select`, `insert`, `update` y `delete`.
2. Edita `config.js` y pega la URL de tu proyecto y su **publishable key**. También sirve la antigua clave `anon`. Nunca pongas una clave secreta o `service_role` en el frontend.
3. Sirve esta carpeta con un servidor estático. Por ejemplo, si tienes Python instalado, abre una terminal en ella y ejecuta:

   ```bash
   python3 -m http.server 8000 --bind 127.0.0.1
   ```

   También puedes usar Live Server de VS Code. En Windows el comando de Python puede ser `py -m http.server 8000 --bind 127.0.0.1`.

4. Abre [http://localhost:8000](http://localhost:8000) e inicia sesión con el usuario creado en Supabase.

No abras `index.html` mediante doble clic: las importaciones de módulos necesitan que la página se sirva por HTTP. Se necesita conexión a Internet para cargar el SDK desde el CDN y acceder a Supabase. El servidor estático solo entrega los archivos; el navegador se comunica con Supabase.

## Archivos y responsabilidades

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Formularios de login y de producto, y una lista vacía. |
| `estilos.css` | Unas pocas reglas de presentación. |
| `app.js` | Leer los formularios, atender eventos y mostrar los datos. |
| `servicios.js` | Autenticación y operaciones sobre la lista mediante el SDK. |
| `config.js` | URL y clave pública del proyecto. |

```text
HTML y eventos → app.js → servicios.js → SDK de Supabase → backend con RLS
```

Todas las llamadas a Supabase están en `servicios.js`. La interfaz utiliza funciones sencillas:

```javascript
const usuario = await login(email, password);
const productos = await getLista(usuario.id);
await addToLista('Leche', usuario.id);
await setComprado(producto.id, true, usuario.id);
await borrarDeLista(producto.id, usuario.id);
await logout();
```

`getUsuarioActual()` devuelve el usuario de la sesión guardada o `null`. La sesión se utiliza para presentar la interfaz; las políticas RLS del servidor deciden qué datos se pueden leer o modificar. El SDK gestiona las credenciales de las peticiones.

Las funciones de servicios devuelven los datos que necesita la interfaz o lanzan un error. Por eso `app.js` no necesita conocer las respuestas `{ data, error }` de Supabase.

## Cómo leer el JavaScript del navegador

Para una primera lectura bastan estas ideas:

- `document.querySelector(...)` busca un elemento del HTML mediante su `id`.
- `addEventListener(...)` indica qué hacer cuando ocurre algo, como pulsar un botón o enviar un formulario.
- `preventDefault()` evita la recarga habitual al enviar un formulario.
- `value` permite leer un campo; `textContent` permite escribir texto; `hidden` permite ocultar una sección.
- `createElement(...)` crea las filas de la lista. Los nombres se insertan como texto, sin interpretar HTML.
- `await` espera el resultado de un servicio antes de actualizar la pantalla.

La función `ejecutar` desactiva los controles mientras espera una operación y muestra sus errores. Después de añadir, marcar o borrar un producto se vuelve a consultar la lista. Así no hay que mantener dos copias de los datos sincronizadas.

## Correspondencia con la práctica

La tabla se llama `lista` y sus campos son `id`, `nombre`, `comprado` y `usuario`. El frontend no necesita `created_at`, aunque puede estar en la tabla. `usuario` contiene el UUID de Supabase Auth; `id` se genera en la base de datos.

Las consultas filtran por usuario para expresar la intención del servicio. **Ese filtro no sustituye RLS**: hay que mantener las cuatro políticas de la práctica. En las modificaciones se filtra además por `id`, para actuar sobre un único producto. El `select('id').single()` final permite detectar una modificación que no haya afectado a ninguna fila, por ejemplo por falta de permisos.

La aplicación permite entrar, recuperar la sesión al recargar, consultar, añadir, marcar/desmarcar, borrar y cerrar la sesión local. Se usan los usuarios creados desde el panel, igual que en la práctica. Para mantener breve el ejemplo, no se añaden registro de usuarios ni actualizaciones en tiempo real: el botón «Actualizar lista» vuelve a consultar los datos.

## Comprobación con tu proyecto

Entra con un usuario, añade un producto, márcalo como comprado, desmárcalo y bórralo. Recarga para comprobar que se conserva la sesión. Cierra sesión y entra con otro usuario: su lista debe ser independiente. Si alguna operación falla, revisa el mensaje de la página y la política correspondiente en Supabase.

El frontend se ha comprobado en un navegador con el SDK real y un servidor local que simula las respuestas de Supabase: login válido e inválido, sesión al recargar, altas, marcado/desmarcado, borrado, cambio de usuario, validación de nombres y errores de escritura. Queda por comprobar la conexión y las políticas RLS de tu proyecto real al completar `config.js`.

Referencias del SDK: [login](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [select](https://supabase.com/docs/reference/javascript/select), [insert](https://supabase.com/docs/reference/javascript/insert), [update](https://supabase.com/docs/reference/javascript/update) y [delete](https://supabase.com/docs/reference/javascript/delete).
