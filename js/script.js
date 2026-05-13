let carrito = [];
let favoritos = [];
let medioPagoSeleccionado = "";

// --- Sector de Worker ---
const workerSubtotal = new Worker("js/worker.js");

workerSubtotal.onmessage = function (event) {
  const subtotal = event.data;
  const total = subtotal * 1.21;

  document.getElementById("subtotal").textContent = subtotal.toLocaleString("es-AR");
  document.getElementById("total").textContent = total.toLocaleString("es-AR");
};

// --- Inicio las variables ---
document.addEventListener("DOMContentLoaded", function () {
  cargarFavoritos();
  inicializarFormulario();
  inicializarCheckboxes();
  actualizarMontos();
});

// --- Inicio formulario ---
function inicializarFormulario() {
  const formPedido = document.getElementById("formPedido");

  formPedido.addEventListener("submit", function (e) {
    e.preventDefault();

    const nombreUsuario = document.getElementById("nombre").value;
    const mensaje = document.getElementById("mensajePedido");

    if (medioPagoSeleccionado === "") {
      mensaje.textContent = "Debe seleccionar un medio de pago antes de enviar el pedido.";
      return;
    }

    // Valida el formulario correspondiente al medio de pago elegido
    if (!validarFormularioPagoSeleccionado()) {
      return;
    }

    obtenerUbicacion(function (ok) {
      if (ok) {
        mensaje.textContent =
          "¡Gracias " + nombreUsuario +
          "! Su pedido ha sido enviado con éxito. Medio de pago elegido: " +
          medioPagoSeleccionado + ".";

        formPedido.reset();

        document.getElementById("latitud").value = "";
        document.getElementById("longitud").value = "";

        limpiarFormulariosPago();
        medioPagoSeleccionado = "";
        ocultarFormulariosPago();
        quitarSeleccionMedios();

        document.getElementById("mensajePago").textContent =
          "Todavía no seleccionaste un medio de pago.";

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

// --- Lógica de frutas ---
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

// --- Carrito ---
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

// --- Checkboxes clase 7 ---
function inicializarCheckboxes() {
  const checks = document.querySelectorAll(".check-fruta");

  checks.forEach(function (check) {
    check.addEventListener("change", actualizarSeleccionCheckboxes);
  });
}

function actualizarSeleccionCheckboxes() {
  const checks = document.querySelectorAll(".check-fruta:checked");
  let subtotal = 0;
  let nombres = [];

  checks.forEach(function (check) {
    subtotal += parseInt(check.value);
    nombres.push(check.getAttribute("data-nombre"));
  });

  document.getElementById("subtotalSeleccion").textContent =
    subtotal.toLocaleString("es-AR");

  document.getElementById("frutasSeleccionadas").textContent =
    nombres.length > 0 ? nombres.join(", ") : "Ninguna";
}

// --- Medios de pago clase 7 ---
function mostrarFormularioPago(medio, elemento) {
  medioPagoSeleccionado = medio;

  ocultarFormulariosPago();
  quitarSeleccionMedios();

  elemento.classList.add("seleccionado");

  if (medio === "tarjeta") {
    document.getElementById("formTarjeta").classList.remove("oculto");
    document.getElementById("mensajePago").textContent = "Elegiste pagar con tarjeta.";
  }

  if (medio === "transferencia") {
    document.getElementById("formTransferencia").classList.remove("oculto");
    document.getElementById("mensajePago").textContent = "Elegiste pagar por transferencia.";
  }

  if (medio === "efectivo") {
    document.getElementById("formEfectivo").classList.remove("oculto");
    document.getElementById("mensajePago").textContent = "Elegiste pagar en efectivo.";
  }
}

function ocultarFormulariosPago() {
  document.getElementById("formTarjeta").classList.add("oculto");
  document.getElementById("formTransferencia").classList.add("oculto");
  document.getElementById("formEfectivo").classList.add("oculto");
}

function quitarSeleccionMedios() {
  const medios = document.querySelectorAll(".medio-pago");

  medios.forEach(function (medio) {
    medio.classList.remove("seleccionado");
  });
}

// --- Validación del formulario de pago seleccionado ---
function validarFormularioPagoSeleccionado() {
  let formularioPago = null;

  if (medioPagoSeleccionado === "tarjeta") {
    formularioPago = document.getElementById("formTarjeta");
  }

  if (medioPagoSeleccionado === "transferencia") {
    formularioPago = document.getElementById("formTransferencia");
  }

  if (medioPagoSeleccionado === "efectivo") {
    formularioPago = document.getElementById("formEfectivo");
  }

  if (formularioPago && !formularioPago.checkValidity()) {
    formularioPago.reportValidity();
    return false;
  }

  return true;
}

function limpiarFormulariosPago() {
  document.getElementById("formTarjeta").reset();
  document.getElementById("formTransferencia").reset();
  document.getElementById("formEfectivo").reset();
}

// --- Geolocalización ---
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

      salida.textContent =
        "Ubicación detectada: Latitud " + lat + " | Longitud " + lon;

      if (callback) callback(true);
    },
    function () {
      salida.textContent = "No se pudo obtener la ubicación (permiso denegado).";
      if (callback) callback(false);
    }
  );
}