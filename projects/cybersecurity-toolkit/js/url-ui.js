(function () {
  'use strict';

  const form = document.getElementById('url-form');
  const input = document.getElementById('url-input');
  const result = document.getElementById('url-result');
  const empty = document.getElementById('url-empty');
  const error = document.getElementById('url-error');
  const status = document.getElementById('url-status');
  const clearButton = document.getElementById('clear-url');
  const exampleButton = document.getElementById('url-example');

  const labels = {
    protocol: 'Protocolo',
    hostname: 'Host de destino',
    port: 'Puerto',
    path: 'Ruta',
    query: 'Consulta',
    fragment: 'Fragmento',
    parameters: 'Número de parámetros'
  };

  function resetResult() {
    result.replaceChildren();
    result.hidden = true;
    empty.hidden = false;
    error.hidden = true;
    error.textContent = '';
    status.textContent = '';
    clearButton.disabled = !input.value;
  }

  function clear() {
    input.value = '';
    resetResult();
  }

  function showResult(analysis) {
    const summary = document.createElement('h3');
    summary.className = 'url-summary';
    summary.textContent = analysis.findings.length
      ? 'Hay detalles que revisar'
      : 'Sin avisos en estas reglas';

    const list = document.createElement('dl');
    list.className = 'network-results';
    Object.entries(labels).forEach(([key, label]) => {
      const term = document.createElement('dt');
      const detail = document.createElement('dd');
      term.textContent = label;
      // Muestro las partes como texto, sin convertirlas en enlaces o HTML.
      detail.textContent = analysis[key];
      list.append(term, detail);
    });

    const findings = document.createElement('ul');
    findings.className = 'url-findings';
    // Los mensajes informativos se muestran sin cambiar el resumen.
    const messages = analysis.findings.concat(analysis.information);
    messages.forEach((finding) => {
      const item = document.createElement('li');
      const title = document.createElement('strong');
      const detail = document.createElement('p');
      const informative = analysis.information.includes(finding);
      if (informative) item.className = 'url-information';
      title.textContent = finding.label + (informative ? ' · información' : '');
      detail.textContent = finding.detail;
      item.append(title, detail);
      findings.append(item);
    });

    result.append(summary, list, findings);
    result.hidden = false;
    empty.hidden = true;
    status.textContent = 'Análisis terminado. ' + summary.textContent + '.';
  }

  input.addEventListener('input', resetResult);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    resetResult();
    try {
      showResult(window.AnthlabURL.analyzeURL(input.value));
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      input.focus();
    }
  });

  clearButton.addEventListener('click', () => {
    clear();
    input.focus();
  });

  exampleButton.addEventListener('click', () => {
    input.value = 'http://cuenta.example.com@192.0.2.10:8080/iniciar?origen=correo';
    form.requestSubmit();
  });

  window.addEventListener('pagehide', clear);
  clear();
})();
