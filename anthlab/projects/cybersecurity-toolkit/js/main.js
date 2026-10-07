(function () {
  'use strict';

  const api = window.AnthlabPassword;
  const form = document.getElementById('generator-form');
  const lengthInput = document.getElementById('password-length');
  const slider = document.getElementById('length-slider');
  const output = document.getElementById('password-output');
  const hint = document.getElementById('output-hint');
  const copyButton = document.getElementById('copy-password');
  const visibilityButton = document.getElementById('toggle-visibility');
  const status = document.getElementById('status-message');
  const error = document.getElementById('form-error');

  let hidden = false;

  function getConfig() {
    return {
      length: lengthInput.valueAsNumber,
      groups: Array.from(
        form.querySelectorAll('input[name="group"]:checked'),
        (element) => element.value
      ),
      excludeAmbiguous: document.getElementById('exclude-ambiguous').checked
    };
  }

  function showError(message) {
    error.textContent = message;
    error.hidden = !message;
  }

  function announce(message) {
    status.textContent = '';
    window.setTimeout(() => {
      status.textContent = message;
    }, 20);
  }

  function updateSummary() {
    try {
      const summary = api.describeSettings(getConfig());
      document.getElementById('alphabet-size').textContent = summary.alphabetSize;
      document.getElementById('group-count').textContent = summary.groupCount;
      document.getElementById('search-space').textContent = summary.bits.toFixed(1);
    } catch (err) {
      document.getElementById('alphabet-size').textContent = '—';
      document.getElementById('group-count').textContent = getConfig().groups.length;
      document.getElementById('search-space').textContent = '—';
    }
  }

  function clearPassword() {
    output.value = '';
    copyButton.disabled = true;
    visibilityButton.disabled = true;
    copyButton.lastChild.textContent = 'Copiar';
    hint.textContent = 'Has cambiado los ajustes. Genera una contraseña nueva.';
    status.textContent = '';
    showError('');
    updateSummary();
  }

  slider.addEventListener('input', () => {
    lengthInput.value = slider.value;
    clearPassword();
  });

  lengthInput.addEventListener('input', () => {
    if (lengthInput.validity.valid) {
      slider.value = lengthInput.value;
    }
    clearPassword();
  });

  form.querySelectorAll('input[type="checkbox"]').forEach((element) => {
    element.addEventListener('change', clearPassword);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    showError('');

    try {
      const settings = getConfig();
      output.value = api.generatePassword(settings);
      output.type = hidden ? 'password' : 'text';
      copyButton.disabled = false;
      visibilityButton.disabled = false;
      copyButton.lastChild.textContent = 'Copiar';
      hint.textContent = `${settings.length} caracteres · incluye todos los tipos seleccionados`;
      announce('Contraseña nueva generada.');
      updateSummary();
    } catch (err) {
      output.value = '';
      copyButton.disabled = true;
      visibilityButton.disabled = true;
      status.textContent = '';
      showError(err.message);
    }
  });

  visibilityButton.addEventListener('click', () => {
    hidden = !hidden;
    output.type = hidden ? 'password' : 'text';
    visibilityButton.textContent = hidden ? 'Mostrar' : 'Ocultar';
    visibilityButton.setAttribute('aria-pressed', String(hidden));
  });

  copyButton.addEventListener('click', async () => {
    if (!output.value) return;

    try {
      if (!navigator.clipboard || !window.isSecureContext) {
        throw new Error('Portapapeles no disponible');
      }

      await navigator.clipboard.writeText(output.value);
      announce('Contraseña copiada al portapapeles.');
    } catch (err) {
      hidden = false;
      output.type = 'text';
      visibilityButton.textContent = 'Ocultar';
      visibilityButton.setAttribute('aria-pressed', 'false');
      output.focus();
      output.select();
      announce('No se ha podido copiar automáticamente. La contraseña está seleccionada para copiarla manualmente.');
    }
  });

  updateSummary();
})();

// Cambiar de herramienta sin recargar la página.
(function () {
  'use strict';

  const panels = Array.from(document.querySelectorAll('.tool-panel'));
  const links = Array.from(document.querySelectorAll('.tool-nav .tool-link'));
  const howLink = document.querySelector('.how-link');
  let selected = 'generator';

  function updateTool() {
    const hash = window.location.hash;
    const target = document.getElementById(hash.slice(1));
    const panel = target && target.closest('.tool-panel');
    if (!hash) selected = 'generator';
    else if (panel) selected = panel.id;

    panels.forEach((panel) => { panel.hidden = panel.id !== selected; });
    links.forEach((link) => {
      const active = link.getAttribute('href') === `#${selected}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    howLink.setAttribute('href', selected === 'analyzer' ? '#analyzer-how' : '#how-it-works');

    if (window.innerWidth <= 900) {
      const activeLink = links.find((link) => link.classList.contains('active'));
      activeLink.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    if (target) target.scrollIntoView({ block: 'start' });
  }

  window.addEventListener('hashchange', updateTool);
  updateTool();
})();
