(function () {
  'use strict';

  const form = document.getElementById('analyzer-form');
  const input = document.getElementById('candidate-password');
  const visibility = document.getElementById('analyzer-visibility');
  const clearButton = document.getElementById('clear-analysis');
  const error = document.getElementById('analyzer-error');
  const status = document.getElementById('analyzer-status');
  const empty = document.getElementById('analysis-empty');
  const result = document.getElementById('analysis-result');
  const findings = document.getElementById('analysis-findings');
  const types = document.getElementById('analysis-types');

  function resetResult() {
    result.hidden = true;
    empty.hidden = false;
    findings.replaceChildren();
    types.replaceChildren();
    error.textContent = '';
    error.hidden = true;
    status.textContent = '';
    document.getElementById('analysis-length').textContent = '—';
    document.getElementById('analysis-type-count').textContent = '—';
    document.getElementById('analysis-verdict-title').textContent = '';
    document.getElementById('analysis-verdict-detail').textContent = '';
  }

  function updateInput() {
    document.getElementById('analysis-character-count').textContent = `${[...input.value].length} caracteres`;
    visibility.disabled = !input.value;
    clearButton.disabled = !input.value;
  }

  function clear() {
    input.value = '';
    input.type = 'password';
    visibility.textContent = 'Mostrar';
    visibility.setAttribute('aria-pressed', 'false');
    resetResult();
    updateInput();
  }

  input.addEventListener('input', () => {
    resetResult();
    updateInput();
  });

  visibility.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    visibility.textContent = show ? 'Ocultar' : 'Mostrar';
    visibility.setAttribute('aria-pressed', String(show));
  });

  clearButton.addEventListener('click', () => {
    clear();
    input.focus();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    resetResult();

    try {
      const analysis = window.AnthlabAnalyzer.analyzePassword(input.value);
      const verdict = document.getElementById('analysis-verdict');
      verdict.dataset.tone = analysis.verdict.tone;
      document.getElementById('analysis-verdict-title').textContent = analysis.verdict.label;
      document.getElementById('analysis-verdict-detail').textContent = analysis.verdict.detail;
      document.getElementById('analysis-length').textContent = analysis.length;
      document.getElementById('analysis-type-count').textContent = analysis.types.length;

      analysis.types.forEach((name) => {
        const tag = document.createElement('span');
        tag.className = 'analysis-tag';
        tag.textContent = name;
        types.appendChild(tag);
      });

      analysis.checks.forEach((check) => {
        const item = document.createElement('li');
        const marker = document.createElement('span');
        const text = document.createElement('div');
        const label = document.createElement('strong');
        const detail = document.createElement('p');
        item.className = check.warning ? 'finding warning' : 'finding';
        marker.className = 'finding-marker';
        marker.setAttribute('aria-hidden', 'true');
        marker.textContent = check.warning ? '!' : '·';
        label.textContent = check.warning ? `${check.label} · aviso` : check.label;
        detail.textContent = check.detail;
        text.append(label, detail);
        item.append(marker, text);
        findings.appendChild(item);
      });

      empty.hidden = true;
      result.hidden = false;
      status.textContent = `Análisis terminado. ${analysis.verdict.label}.`;
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      input.focus();
    }
  });

  window.addEventListener('pagehide', clear);
  clear();
})();
