// La interfaz llama a nuestros servicios, nunca directamente a Supabase.
import {
  login, logout, getUsuarioActual,
  getLista, addToLista, setComprado, borrarDeLista
} from './servicios.js';

// Referencias a los elementos del HTML que vamos a utilizar.
const formLogin = document.querySelector('#form-login');
const formProducto = document.querySelector('#form-producto');
const seccionLista = document.querySelector('#seccion-lista');
const lista = document.querySelector('#lista');
const listaVacia = document.querySelector('#lista-vacia');
const mensaje = document.querySelector('#mensaje');
const controles = document.querySelector('#controles');
const nombre = document.querySelector('#nombre');
const email = document.querySelector('#email');
const password = document.querySelector('#password');
let usuarioActual = null;

// Centralizamos la espera y los errores para no repetir try/catch en cada botón.
async function ejecutar(operacion) {
  controles.disabled = true;
  mensaje.textContent = 'Cargando…';
  try {
    await operacion();
    mensaje.textContent = '';
  } catch (error) {
    mensaje.textContent = error.message;
  } finally {
    controles.disabled = false;
  }
}

function mostrarPantalla() {
  formLogin.hidden = usuarioActual !== null;
  seccionLista.hidden = usuarioActual === null;
  document.querySelector('#usuario').textContent = usuarioActual ? usuarioActual.email : '';
  lista.replaceChildren();
  listaVacia.hidden = true;
}

async function cargarLista() {
  const productos = await getLista(usuarioActual.id);
  lista.replaceChildren();
  listaVacia.hidden = productos.length !== 0;

  for (const producto of productos) {
    const fila = document.createElement('li');
    const etiqueta = document.createElement('label');
    const casilla = document.createElement('input');
    const texto = document.createElement('span');
    const borrar = document.createElement('button');

    casilla.type = 'checkbox';
    casilla.checked = producto.comprado === true;
    texto.textContent = producto.nombre;
    texto.className = producto.comprado ? 'comprado' : '';
    borrar.type = 'button';
    borrar.textContent = 'Borrar';
    borrar.setAttribute('aria-label', `Borrar ${producto.nombre}`);

    casilla.addEventListener('change', () => {
      const comprado = casilla.checked;
      // Conservamos el estado anterior hasta que el servidor confirme el cambio.
      casilla.checked = producto.comprado === true;
      ejecutar(async () => {
        await setComprado(producto.id, comprado, usuarioActual.id);
        await cargarLista();
      });
    });

    borrar.addEventListener('click', () => {
      ejecutar(async () => {
        await borrarDeLista(producto.id, usuarioActual.id);
        await cargarLista();
      });
    });

    // textContent trata el nombre como texto, aunque contenga etiquetas HTML.
    etiqueta.append(casilla, ' ', texto);
    fila.append(etiqueta, ' ', borrar);
    lista.append(fila);
  }
}

formLogin.addEventListener('submit', (evento) => {
  evento.preventDefault(); // Evita que el formulario recargue la página.
  ejecutar(async () => {
    usuarioActual = await login(email.value.trim(), password.value);
    formLogin.reset();
    mostrarPantalla();
    await cargarLista();
  });
});

formProducto.addEventListener('submit', (evento) => {
  evento.preventDefault();
  ejecutar(async () => {
    await addToLista(nombre.value, usuarioActual.id);
    formProducto.reset();
    await cargarLista();
  });
});

document.querySelector('#salir').addEventListener('click', () => {
  ejecutar(async () => {
    await logout();
    usuarioActual = null;
    formProducto.reset();
    mostrarPantalla();
  });
});

document.querySelector('#actualizar').addEventListener('click', () => {
  ejecutar(cargarLista);
});

// Al recargar la página, recuperamos la sesión guardada por el SDK.
ejecutar(async () => {
  usuarioActual = await getUsuarioActual();
  mostrarPantalla();
  if (usuarioActual) await cargarLista();
});
