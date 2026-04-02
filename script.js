let carrito = [];
let listaCompras = [];

// Worker para calcular el subtotal
const workerSubtotal = new Worker("worker.js");

workerSubtotal.onmessage = function (event) {
  const subtotal = event.data;
  const total = subtotal * 1.21;

  document.getElementById("subtotal").textContent = subtotal.toLocaleString("es-AR");
  document.getElementById("total").textContent = total.toLocaleString("es-AR");
};

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  const favoritosGuardados = JSON.parse(localStorage.getItem("favoritos")) || [];

  favoritosGuardados.forEach(nombre => {
    listaCompras.push(nombre);
    renderizarItemLista(nombre);
  });

  const formPedido = document.getElementById("formPedido");

  formPedido.addEventListener("submit", function (e) {
    e.preventDefault();

    const nombreUsuario = document.getElementById("nombre").value;
    const mensaje = document.getElementById("mensajePedido");

    obtenerUbicacion((ok) => {
      if (ok) {
        mensaje.textContent = `¡Gracias ${nombreUsuario}! Su pedido ha sido enviado con éxito.`;
      } else {
        mensaje.textContent = "No se pudo obtener la ubicación del cliente.";
      }
    });
  });
});

// --- DRAG AND DROP ---
function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("nombre", ev.target.getAttribute("data-nombre"));
  ev.dataTransfer.setData("precio", ev.target.getAttribute("data-precio"));
}

function dropCarrito(ev) {
  ev.preventDefault();

  const nombre = ev.dataTransfer.getData("nombre");
  const precio = parseInt(ev.dataTransfer.getData("precio"));

  if (nombre && precio) {
    agregarAlCarrito(nombre, precio);
  }
}

function dropLista(ev) {
  ev.preventDefault();

  const nombre = ev.dataTransfer.getData("nombre");

  if (nombre) {
    agregarALista(nombre);
  }
}

// --- CARRITO ---
function agregarAlCarrito(nombre, precio) {
  carrito.push({ nombre, precio });

  const listaUI = document.getElementById("itemsCarrito");
  const nuevoItem = document.createElement("li");
  nuevoItem.textContent = `${nombre} - $${precio}`;
  listaUI.appendChild(nuevoItem);

  actualizarMontos();
}

function actualizarMontos() {
  const precios = carrito.map(producto => producto.precio);
  workerSubtotal.postMessage(precios);
}

// --- FAVORITOS / LOCALSTORAGE ---
function agregarALista(nombre) {
  if (listaCompras.includes(nombre)) {
    return;
  }

  if (listaCompras.length >= 5) {
    alert("Solo puede guardar hasta 5 frutas en favoritos.");
    return;
  }

  listaCompras.push(nombre);
  renderizarItemLista(nombre);
  localStorage.setItem("favoritos", JSON.stringify(listaCompras));
}

function renderizarItemLista(nombre) {
  const listaUI = document.getElementById("itemsLista");
  const nuevoItem = document.createElement("li");
  nuevoItem.textContent = nombre;
  listaUI.appendChild(nuevoItem);
}

function borrarLista() {
  listaCompras = [];
  localStorage.removeItem("favoritos");
  document.getElementById("itemsLista").innerHTML = "";
}

// --- GEOLOCALIZACIÓN ---
function obtenerUbicacion(callback) {
  const salida = document.getElementById("resultadoUbicacion");

  if (!navigator.geolocation) {
    salida.textContent = "La geolocalización no es soportada por su navegador.";
    if (callback) callback(false);
    return;
  }

  salida.textContent = "Localizando...";

  navigator.geolocation.getCurrentPosition(
    (posicion) => {
      const lat = posicion.coords.latitude.toFixed(4);
      const lon = posicion.coords.longitude.toFixed(4);

      document.getElementById("latitud").value = lat;
      document.getElementById("longitud").value = lon;

      salida.textContent = `Ubicación detectada: Latitud ${lat} | Longitud ${lon}`;

      if (callback) callback(true);
    },
    () => {
      salida.textContent = "No se pudo obtener la ubicación (permiso denegado).";
      if (callback) callback(false);
    }
  );
}