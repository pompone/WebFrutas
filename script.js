let carrito = [];
let favoritos = [];

// --- Sector de Worker ---
const workerSubtotal = new Worker("worker.js");

workerSubtotal.onmessage = function (event) {
  const subtotal = event.data;
  const total = subtotal * 1.21;

  document.getElementById("subtotal").textContent = subtotal.toLocaleString("es-AR");
  document.getElementById("total").textContent = total.toLocaleString("es-AR");
  // Se agrega toLocaleString("es-AR") para mostrar los montos con formato numérico argentino. 
};

// --- Inicio las variables ---
document.addEventListener("DOMContentLoaded", function () {
  cargarFavoritos();
  inicializarFormulario();
  actualizarMontos();
});

// --- Inicio los eventos ---
function inicializarFormulario() {
  const formPedido = document.getElementById("formPedido");

  formPedido.addEventListener("submit", function (e) {
    e.preventDefault();

    const nombreUsuario = document.getElementById("nombre").value;
    const mensaje = document.getElementById("mensajePedido");

    obtenerUbicacion(function (ok) {
      if (ok) {
        mensaje.textContent = "¡Gracias " + nombreUsuario + "! Su pedido ha sido enviado con éxito.";
        formPedido.reset();
        document.getElementById("latitud").value = "";
        document.getElementById("longitud").value = "";
      } else {
        mensaje.textContent = "No se pudo obtener la ubicación del cliente.";
      }
    });
  });
}

// --- Comienzo de Drag & Drop ---
function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.currentTarget.id);
  ev.dataTransfer.setData("origen", "catalogo");
}

function dropEnCarrito(ev) {
  ev.preventDefault();
  const origen = ev.dataTransfer.getData("origen");
  if (origen === "carrito") return;
  const id = ev.dataTransfer.getData("text");
  agregarAlCarrito(id);
}

function dropEnFavoritos(ev) {
  ev.preventDefault();
  const origen = ev.dataTransfer.getData("origen");
  if (origen === "carrito") return;
  const id = ev.dataTransfer.getData("text");
  agregarAFavoritos(id);
}

function dropEnCatalogo(ev) {
  ev.preventDefault();
  const origen = ev.dataTransfer.getData("origen");
  if (origen !== "carrito") return;
  const index = parseInt(ev.dataTransfer.getData("indexCarrito"));
  quitarDelCarrito(index);
}

// --- esta parte es la logica de frutas ---
function obtenerDatosFruta(idFruta) {
  const fruta = document.getElementById(idFruta);
  if (!fruta) return null;

  return {
    id: idFruta,
    nombre: fruta.getAttribute("data-nombre"),
    precio: parseInt(fruta.getAttribute("data-precio")),
    emoji: fruta.querySelector(".emoji-fruta").textContent
  };
}

// --- Logica del carrito ---
function agregarAlCarrito(idFruta) {
  const datos = obtenerDatosFruta(idFruta);
  if (!datos) return;

  carrito.push(datos);
  renderizarCarrito();
  actualizarMontos();
}

function quitarDelCarrito(index) {
  carrito.splice(index, 1);
  renderizarCarrito();
  actualizarMontos();
}

function renderizarCarrito() {
  const zonaCarrito = document.getElementById("zonaCarrito");
  zonaCarrito.innerHTML = "";

  carrito.forEach(function (fruta, index) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-fruta tarjeta-copia";
    tarjeta.draggable = true;
    tarjeta.title = "Arrastrá al catálogo para quitar";
    tarjeta.innerHTML =
      '<div class="emoji-fruta">' + fruta.emoji + '</div>' +
      '<h3>' + fruta.nombre + '</h3>' +
      '<p>Precio: $' + fruta.precio + '</p>' +
      '<p><small>↩ Arrastrá al catálogo para quitar</small></p>';

    tarjeta.addEventListener("dragstart", function (ev) {
      ev.dataTransfer.setData("origen", "carrito");
      ev.dataTransfer.setData("indexCarrito", index);
    });

    zonaCarrito.appendChild(tarjeta);
  });
}

function actualizarMontos() {
  const precios = [];

  for (let i = 0; i < carrito.length; i++) {
    precios.push(carrito[i].precio);
  }

  workerSubtotal.postMessage(precios);

  document.getElementById("badgeCarrito2").textContent = carrito.length;
  document.getElementById("badgeCarritoNav").textContent = carrito.length;
}

// --- Favoritos ---
function agregarAFavoritos(idFruta) {
  const datos = obtenerDatosFruta(idFruta);
  if (!datos) return;

  let yaExiste = false;

  for (let i = 0; i < favoritos.length; i++) {
    if (favoritos[i].nombre === datos.nombre) {
      yaExiste = true;
    }
  }

  if (yaExiste) return;

    favoritos.push(datos);
  guardarFavoritos();
  renderizarFavoritos();
}

function borrarFavoritos() {
  favoritos = [];
  localStorage.removeItem("favoritos");
  renderizarFavoritos();
}

function renderizarFavoritos() {
  const zonaFavoritos = document.getElementById("zonaFavoritos");
  zonaFavoritos.innerHTML = "";

  favoritos.forEach(function (fruta) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-fruta tarjeta-copia";
    tarjeta.innerHTML =
      '<div class="emoji-fruta">' + fruta.emoji + '</div>' +
      '<h3>' + fruta.nombre + '</h3>' +
      '<p>Favorito</p>';

    zonaFavoritos.appendChild(tarjeta);
  });
}

function guardarFavoritos() {
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
}

function cargarFavoritos() {
  favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
  renderizarFavoritos();
}

// --- Botones ---
function agregarAlCarritoDesdeBoton(idFruta) {
  agregarAlCarrito(idFruta);
}

function agregarAFavoritosDesdeBoton(idFruta) {
  agregarAFavoritos(idFruta);
}

// --- Geolocalizacion ---
function obtenerUbicacion(callback) {
  var salida = document.getElementById("resultadoUbicacion");

  if (!navigator.geolocation) {
    salida.textContent = "La geolocalización no es soportada por su navegador.";
    if (callback) callback(false);
    return;
  }

  salida.textContent = "Localizando...";

  navigator.geolocation.getCurrentPosition(
    function (posicion) {
      var lat = posicion.coords.latitude.toFixed(4);
      var lon = posicion.coords.longitude.toFixed(4);

      document.getElementById("latitud").value = lat;
      document.getElementById("longitud").value = lon;

      salida.textContent = "Ubicación detectada: Latitud " + lat + " | Longitud " + lon;

      if (callback) callback(true);
    },
    function () {
      salida.textContent = "No se pudo obtener la ubicación (permiso denegado).";
      if (callback) callback(false);
    }
  );
}