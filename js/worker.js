onmessage = function (event) {
  const precios = event.data;
  let subtotal = 0;

  for (let i = 0; i < precios.length; i++) {
    subtotal += precios[i];
  }

  postMessage(subtotal);
};