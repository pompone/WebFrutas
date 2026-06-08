self.onmessage = function (event) {
  var carrito = event.data;
  var subtotal = 0;

  for (var i = 0; i < carrito.length; i++) {
    subtotal += carrito[i].precio;
  }

  var total = subtotal * 1.21;

  self.postMessage({
    subtotal: subtotal,
    total: total
  });
};