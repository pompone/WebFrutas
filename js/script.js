var app = angular.module("frutasApp", []);

var workerSubtotal = null;

if (window.Worker) {
  try {
    workerSubtotal = new Worker("js/worker.js");
  } catch (error) {
    workerSubtotal = null;
    console.warn("No se pudo iniciar el Web Worker. Se usará cálculo directo.", error);
  }
}

app.controller("FrutasController", function ($scope, $sce) {
  $scope.logueado = false;

  $scope.seccionActiva = "catalogo";

  $scope.cambiarSeccion = function (seccion) {
    $scope.seccionActiva = seccion;
  };

  $scope.login = {
    usuario: "",
    clave: ""
  };

  $scope.mensajeLogin = "";
  $scope.mensajePedido = "";
  $scope.mensajePago = "Todavía no seleccionaste un medio de pago.";
  $scope.resultadoUbicacion = "Presione el botón para conocer su ubicación.";
  $scope.linkMapa = "";
  $scope.mapaUrl = "";

  $scope.estiloTitulo = {
    transform: "scale(1)",
    color: "white"
  };

  $scope.frutas = [
    {
      nombre: "Manzana",
      precio: 1200,
      icono: "\uD83C\uDF4E",
      descripcion: "Fruta fresca de estación",
      seleccionada: false
    },
    {
      nombre: "Banana",
      precio: 1500,
      icono: "\uD83C\uDF4C",
      descripcion: "Ideal para desayunos y licuados",
      seleccionada: false
    },
    {
      nombre: "Naranja",
      precio: 1300,
      icono: "\uD83C\uDF4A",
      descripcion: "Cítrico rico en vitamina C",
      seleccionada: false
    },
    {
      nombre: "Pera",
      precio: 1400,
      icono: "\uD83C\uDF50",
      descripcion: "Fruta dulce y jugosa",
      seleccionada: false
    }
  ];

  $scope.carrito = [];
  $scope.listaCompras = JSON.parse(localStorage.getItem("favoritos")) || [];
  $scope.medioPago = "";

  $scope.subtotalCarrito = 0;
  $scope.totalCarrito = 0;

  $scope.pedido = {};

  $scope.pago = {
    tarjeta: {},
    transferencia: {},
    efectivo: {}
  };

  $scope.subtotalSeleccion = 0;
  $scope.frutasSeleccionadasTexto = "Ninguna";

  if (workerSubtotal) {
    workerSubtotal.onmessage = function (event) {
      $scope.$apply(function () {
        $scope.subtotalCarrito = event.data.subtotal;
        $scope.totalCarrito = event.data.total;
      });
    };
  }

  $scope.actualizarTotalesCarrito = function () {
    if (workerSubtotal) {
      workerSubtotal.postMessage($scope.carrito);
    } else {
      var subtotal = 0;

      for (var i = 0; i < $scope.carrito.length; i++) {
        subtotal += $scope.carrito[i].precio;
      }

      $scope.subtotalCarrito = subtotal;
      $scope.totalCarrito = subtotal * 1.21;
    }
  };

  $scope.ingresar = function () {
    if (!$scope.login.usuario || !$scope.login.clave) {
      $scope.mensajeLogin = "Debe ingresar usuario y contraseña.";
      return;
    }

    if ($scope.login.usuario === "test" && $scope.login.clave === "test") {
      $scope.logueado = true;
      $scope.mensajeLogin = "";
      $scope.seccionActiva = "catalogo";
    } else {
      $scope.mensajeLogin = "Usuario o contraseña incorrectos.";
    }
  };

  $scope.cerrarSesion = function () {
    $scope.logueado = false;
    $scope.mensajeLogin = "";
    $scope.mensajePedido = "";
    $scope.mensajePago = "Todavía no seleccionaste un medio de pago.";
    $scope.medioPago = "";
    $scope.seccionActiva = "catalogo";
  };

   $scope.destacarTitulo = function () {
    $scope.estiloTitulo = {
      color: "#e0f2fe",
      textShadow: "0 0 12px rgba(255, 255, 255, 0.8)"
    };
  };

  $scope.restaurarTitulo = function () {
    $scope.estiloTitulo = {
      color: "white",
      textShadow: "none"
    };
  };

  $scope.agregarAlCarrito = function (fruta) {
    $scope.carrito.push({
      nombre: fruta.nombre,
      precio: fruta.precio,
      icono: fruta.icono
    });

    $scope.actualizarTotalesCarrito();
  };

  $scope.quitarDelCarrito = function (indice) {
    $scope.carrito.splice(indice, 1);
    $scope.actualizarTotalesCarrito();
  };

  $scope.quitarDelCarritoPorFruta = function (fruta) {
    for (var i = 0; i < $scope.carrito.length; i++) {
      if (
        $scope.carrito[i].nombre === fruta.nombre &&
        $scope.carrito[i].precio === fruta.precio
      ) {
        $scope.carrito.splice(i, 1);
        break;
      }
    }

    $scope.actualizarTotalesCarrito();
  };

  $scope.agregarALista = function (fruta) {
    if ($scope.listaCompras.indexOf(fruta.nombre) !== -1) {
      return;
    }

    if ($scope.listaCompras.length >= 5) {
      alert("La lista de favoritos permite guardar hasta 5 frutas.");
      return;
    }

    $scope.listaCompras.push(fruta.nombre);
    localStorage.setItem("favoritos", JSON.stringify($scope.listaCompras));
  };

  $scope.quitarDeLista = function (indice) {
    $scope.listaCompras.splice(indice, 1);
    localStorage.setItem("favoritos", JSON.stringify($scope.listaCompras));
  };

  $scope.obtenerIconoFavorito = function (nombreFruta) {
    for (var i = 0; i < $scope.frutas.length; i++) {
      if ($scope.frutas[i].nombre === nombreFruta) {
        return $scope.frutas[i].icono;
      }
    }

    return "\uD83C\uDF53";
  };

  $scope.borrarFavoritos = function () {
    $scope.listaCompras = [];
    localStorage.removeItem("favoritos");
  };

  $scope.actualizarSeleccion = function () {
    var subtotal = 0;
    var nombres = [];

    for (var i = 0; i < $scope.frutas.length; i++) {
      if ($scope.frutas[i].seleccionada) {
        subtotal += $scope.frutas[i].precio;
        nombres.push($scope.frutas[i].nombre);
      }
    }

    $scope.subtotalSeleccion = subtotal;
    $scope.frutasSeleccionadasTexto =
      nombres.length > 0 ? nombres.join(", ") : "Ninguna";
  };

  $scope.seleccionarPago = function (medio) {
    $scope.medioPago = medio;
    $scope.cambiarSeccion("pago");

    if (medio === "tarjeta") {
      $scope.mensajePago = "Elegiste pagar con tarjeta.";
    }

    if (medio === "transferencia") {
      $scope.mensajePago = "Elegiste pagar por transferencia.";
    }

    if (medio === "efectivo") {
      $scope.mensajePago = "Elegiste pagar en efectivo.";
    }
  };

  $scope.enviarPedido = function (evento) {
    if (evento && evento.preventDefault) {
      evento.preventDefault();
    }

    if (!$scope.medioPago) {
      $scope.mensajePedido =
        "Debe seleccionar un medio de pago antes de enviar el pedido.";
      return;
    }

    if (
      !$scope.pedido.nombre ||
      !$scope.pedido.apellido ||
      !$scope.pedido.direccion ||
      !$scope.pedido.telefono ||
      !$scope.pedido.detalle
    ) {
      $scope.mensajePedido = "Debe completar todos los datos del pedido.";
      return;
    }

    $scope.mensajePedido =
      "¡Gracias " +
      $scope.pedido.nombre +
      "! Su pedido fue enviado con éxito. Medio de pago elegido: " +
      $scope.medioPago +
      ".";

    $scope.pedido = {};
    $scope.mensajePago = "Medio de pago seleccionado: " + $scope.medioPago + ".";
  };

  $scope.obtenerUbicacion = function () {
    if (!navigator.geolocation) {
      $scope.resultadoUbicacion =
        "La geolocalización no es soportada por su navegador.";
      return;
    }

    $scope.resultadoUbicacion = "Localizando...";

    navigator.geolocation.getCurrentPosition(
      function (posicion) {
        $scope.$apply(function () {
          var lat = posicion.coords.latitude.toFixed(4);
          var lon = posicion.coords.longitude.toFixed(4);

          $scope.resultadoUbicacion = "Latitud: " + lat + " | Longitud: " + lon;

          $scope.linkMapa = "https://www.google.com/maps?q=" + lat + "," + lon;

          $scope.mapaUrl = $sce.trustAsResourceUrl(
            "https://maps.google.com/maps?q=" +
              lat +
              "," +
              lon +
              "&z=15&output=embed"
          );
        });
      },
      function () {
        $scope.$apply(function () {
          $scope.resultadoUbicacion =
            "No se pudo obtener la ubicación. Verifique los permisos del navegador.";
        });
      }
    );
  };
});

app.directive("frutaArrastrable", function () {
  return {
    restrict: "A",
    scope: {
      frutaArrastrable: "="
    },
    link: function (scope, element) {
      element.attr("draggable", "true");

      element.on("dragstart", function (event) {
        var originalEvent = event.originalEvent || event;

        originalEvent.dataTransfer.setData(
          "application/json",
          angular.toJson(scope.frutaArrastrable)
        );

        originalEvent.dataTransfer.effectAllowed = "copy";
      });
    }
  };
});

app.directive("zonaDestino", function () {
  return {
    restrict: "A",
    link: function (scope, element, attrs) {
      element.on("dragover", function (event) {
        event.preventDefault();
        element.addClass("activa");
      });

      element.on("dragleave", function () {
        element.removeClass("activa");
      });

      element.on("drop", function (event) {
        event.preventDefault();
        element.removeClass("activa");

        var originalEvent = event.originalEvent || event;
        var datos = originalEvent.dataTransfer.getData("application/json");

        if (!datos) {
          return;
        }

        var fruta = angular.fromJson(datos);

        scope.$apply(function () {
          if (attrs.zonaDestino === "carrito") {
            scope.agregarAlCarrito(fruta);
          }

          if (attrs.zonaDestino === "lista") {
            scope.agregarALista(fruta);
          }

          if (attrs.zonaDestino === "catalogo") {
            scope.quitarDelCarritoPorFruta(fruta);
          }
        });
      });
    }
  };
});