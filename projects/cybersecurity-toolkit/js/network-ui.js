(function () {
  'use strict';

  const form = document.getElementById('network-form');
  const address = document.getElementById('network-address');
  const prefix = document.getElementById('network-prefix');
  const result = document.getElementById('network-result');
  const empty = document.getElementById('network-empty');
  const error = document.getElementById('network-error');
  const status = document.getElementById('network-status');
  const exampleButton = document.getElementById('network-example');

  const labels = {
    ip: 'Dirección IPv4',
    type: 'Tipo de dirección',
    binary: 'Binario (32 bits)',
    hex: 'Hexadecimal',
    network: 'Red / CIDR',
    mask: 'Máscara',
    wildcard: 'Máscara inversa',
    broadcast: 'Broadcast',
    first: 'Primer host',
    last: 'Último host',
    total: 'Direcciones totales',
    hosts: 'Hosts utilizables'
  };

  function resetResult() {
    result.hidden = true;
    result.replaceChildren();
    empty.hidden = false;
    error.hidden = true;
    error.textContent = '';
    status.textContent = '';
  }

  function showResult(data) {
    const list = document.createElement('dl');
    list.className = 'network-results';

    Object.entries(data).forEach(([key, value]) => {
      // La nota va debajo de la lista, no como otro dato de la IP.
      if (key === 'note') return;

      const term = document.createElement('dt');
      const detail = document.createElement('dd');
      term.textContent = labels[key];
      detail.textContent = typeof value === 'number'
        ? value.toLocaleString('es-ES')
        : value;
      list.append(term, detail);
    });

    const note = document.createElement('p');
    note.className = 'analysis-limit';
    note.textContent = data.note;
    result.append(list, note);
    result.hidden = false;
    empty.hidden = true;
    status.textContent = 'Análisis terminado. Consulta el resultado.';
  }

  // Si cambio los datos, quito el resultado anterior para no confundirlos.
  form.addEventListener('input', resetResult);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    resetResult();

    try {
      const ipInfo = window.AnthlabNetwork.analyzeIP(address.value);
      const subnet = window.AnthlabNetwork.calculateSubnet(address.value, prefix.value);
      showResult({ ...ipInfo, ...subnet });
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
    }
  });

  exampleButton.addEventListener('click', () => {
    address.value = '192.168.1.10';
    prefix.value = '24';
    form.requestSubmit();
  });
})();
