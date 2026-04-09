onmessage = function (event) {
  var precios = event.data;
  var subtotal = 0;

  for (var i = 0; i < precios.length; i++) {
    subtotal = subtotal + Number(precios[i]);
  }

  postMessage(subtotal);
};