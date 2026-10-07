/* Lógica del generador. La interfaz está en main.js. */
const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
};

const AMBIGUOUS = new Set('O0Il1|');

function getSettings(config) {
  if (!config || !Number.isInteger(config.length) || config.length < 8 || config.length > 64) {
    throw new Error('Elige una longitud entre 8 y 64 caracteres.');
  }

  if (!Array.isArray(config.groups) || config.groups.length === 0) {
    throw new Error('Selecciona al menos un tipo de carácter.');
  }

  const names = [...new Set(config.groups)];
  const groups = names.map((name) => {
    if (!CHARSETS[name]) {
      throw new Error('Hay un tipo de carácter no válido.');
    }

    return [...CHARSETS[name]]
      .filter((char) => !config.excludeAmbiguous || !AMBIGUOUS.has(char))
      .join('');
  });

  return {
    length: config.length,
    groups,
    alphabet: groups.join('')
  };
}

function randomIndex(max, cryptoProvider = globalThis.crypto) {
  if (!cryptoProvider || typeof cryptoProvider.getRandomValues !== 'function') {
    throw new Error('Este navegador no permite generar valores aleatorios seguros.');
  }

  const values = new Uint32Array(1);
  const range = 0x100000000;
  const limit = Math.floor(range / max) * max;
  let value;

  do {
    cryptoProvider.getRandomValues(values);
    value = values[0];
  } while (value >= limit);

  return value % max;
}

function randomCharacter(characters, cryptoProvider) {
  return characters[randomIndex(characters.length, cryptoProvider)];
}

function shuffleSecurely(items, cryptoProvider) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1, cryptoProvider);
    [items[i], items[j]] = [items[j], items[i]];
  }
}

function generatePassword(config, cryptoProvider = globalThis.crypto) {
  const { length, groups, alphabet } = getSettings(config);
  const password = [];

  // Meto primero un carácter de cada grupo seleccionado.
  for (const group of groups) {
    password.push(randomCharacter(group, cryptoProvider));
  }

  // Completo el resto usando todos los caracteres disponibles.
  while (password.length < length) {
    password.push(randomCharacter(alphabet, cryptoProvider));
  }

  // Mezclo el resultado para que los caracteres obligatorios no queden siempre al principio.
  shuffleSecurely(password, cryptoProvider);

  return password.join('');
}

function describeSettings(config) {
  const { length, groups, alphabet } = getSettings(config);

  return {
    alphabetSize: alphabet.length,
    groupCount: groups.length,
    // Límite teórico: no descuenta la obligación de incluir todos los grupos.
    bits: length * Math.log2(alphabet.length)
  };
}

const AnthlabPassword = {
  CHARSETS,
  getSettings,
  generatePassword,
  describeSettings
};

if (typeof window !== 'undefined') {
  window.AnthlabPassword = AnthlabPassword;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnthlabPassword;
}
