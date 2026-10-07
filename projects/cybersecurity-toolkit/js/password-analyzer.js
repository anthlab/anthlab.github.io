/* Reglas del analizador. No calcula tiempos de descifrado. */
const AnthlabAnalyzer = (() => {
  'use strict';

  const MIN_LENGTH = 15;
  const MAX_LENGTH = 256;
  const COMMON = new Set([
    'password', 'contrasena', 'qwerty', 'admin', 'administrator',
    'letmein', 'welcome', 'bienvenido', 'changeme', 'iloveyou',
    'monkey', 'dragon', 'football', 'sunshine', 'princess',
    'secret', 'secreto', 'login', 'usuario', 'default', 'root',
    '123456', '1234567', '12345678', '123456789', '12345',
    '111111', '000000', '123123', 'abc123'
  ]);
  const ROWS = [
    '0123456789', 'abcdefghijklmnopqrstuvwxyz',
    'qwertyuiop', 'asdfghjklñ', 'zxcvbnm'
  ];

  function normalize(value) {
    return value.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '');
  }

  function usesCommonPassword(value) {
    const plain = normalize(value);
    const substitutions = { '@': 'a', '4': 'a', '0': 'o', '3': 'e', '$': 's', '5': 's', '1': 'i', '!': 'i', '7': 't' };
    const simplified = plain.replace(/[@403$51!7]/g, (char) => substitutions[char]);

    // Las palabras largas también se buscan con números o símbolos alrededor.
    return [...COMMON].some((word) =>
      plain.trim() === word || simplified.trim() === word ||
      (word.length >= 5 && /[a-z]/.test(word) &&
        (plain.includes(word) || simplified.includes(word)))
    );
  }

  function hasSequence(value) {
    const plain = normalize(value);
    return ROWS.some((row) => {
      const forward = normalize(row);
      const backward = [...forward].reverse().join('');
      for (let index = 0; index <= forward.length - 4; index += 1) {
        if (plain.includes(forward.slice(index, index + 4)) ||
            plain.includes(backward.slice(index, index + 4))) return true;
      }
      return false;
    });
  }

  function hasRepetition(value) {
    const plain = value.toLowerCase();
    return /(.)\1{2,}/u.test(plain) || /(.{2,8})\1{2}/u.test(plain) ||
      /^(.{2,})\1+$/u.test(plain);
  }

  function getTypes(value) {
    const types = [];
    if (/\p{Lu}/u.test(value)) types.push('Mayúsculas');
    if (/\p{Ll}/u.test(value)) types.push('Minúsculas');
    if (/\p{N}/u.test(value)) types.push('Números');
    if (/[^\p{L}\p{N}\s]/u.test(value)) types.push('Símbolos');
    if (/\s/u.test(value)) types.push('Espacios');
    if ([...value].some((char) => /\p{L}/u.test(char) && !/[\p{Lu}\p{Ll}]/u.test(char))) {
      types.push('Otras letras');
    }
    return types;
  }

  function analyzePassword(password) {
    if (typeof password !== 'string') throw new TypeError('La contraseña debe ser un texto.');
    const length = [...password].length;
    if (!length) throw new Error('Escribe una contraseña de prueba.');
    if (length > MAX_LENGTH) throw new Error('El analizador admite hasta 256 caracteres.');

    const common = usesCommonPassword(password);
    const sequence = hasSequence(password);
    const repetition = hasRepetition(password);
    const year = /(?:19|20)\d{2}/u.test(password);
    const edgeSpaces = /^\s|\s$/u.test(password);
    const onlySpaces = /^\s+$/u.test(password);

    const checks = [
      {
        id: 'length', label: 'Longitud', warning: length < MIN_LENGTH,
        detail: length < MIN_LENGTH
          ? `${length} caracteres. Prueba con 15 o más, sin alargarla a base de repetir lo mismo.`
          : `${length} caracteres. ${length === MIN_LENGTH ? 'Alcanza' : 'Supera'} ` +
            'la referencia de longitud de esta herramienta.'
      },
      {
        id: 'common', label: 'Contraseñas habituales', warning: common,
        detail: common
          ? 'Se parece a uno de los ejemplos habituales de la lista local. Cambiar letras por símbolos no siempre elimina ese patrón.'
          : 'No coincide con los ejemplos de la lista local. La lista es pequeña y no cubre todas las contraseñas habituales.'
      },
      {
        id: 'sequence', label: 'Secuencias', warning: sequence,
        detail: sequence
          ? 'Hay al menos cuatro caracteres seguidos de una secuencia numérica, alfabética o del teclado.'
          : 'No se han encontrado las secuencias sencillas que revisa esta herramienta.'
      },
      {
        id: 'repetition', label: 'Repeticiones', warning: repetition,
        detail: repetition
          ? 'Hay caracteres o bloques repetidos. Añadir más copias aumenta la longitud, pero mantiene el patrón.'
          : 'No se han detectado repeticiones sencillas.'
      },
      {
        id: 'year', label: 'Posibles años', warning: year,
        detail: year
          ? 'Aparece un número entre 1900 y 2099. Si es una fecha relacionada contigo, conviene evitarla.'
          : 'No aparece un número con el formato de año que comprueba el analizador.'
      }
    ];

    if (edgeSpaces) checks.push({
      id: 'spaces', label: 'Espacios en los extremos', warning: true,
      detail: 'Hay espacios al principio o al final. Comprueba que los hayas añadido a propósito.'
    });

    let verdict;
    if (onlySpaces) {
      verdict = { tone: 'warning', label: 'Solo contiene espacios', detail: 'La longitud por sí sola no hace útil una contraseña.' };
    } else if (common || sequence || repetition) {
      verdict = { tone: 'warning', label: 'Tiene patrones previsibles', detail: 'Revisa los avisos antes de quedarte con este ejemplo.' };
    } else if (length < MIN_LENGTH) {
      verdict = { tone: 'attention', label: 'Le falta longitud', detail: 'Puedes usar una clave aleatoria más larga o varias palabras elegidas al azar.' };
    } else if (year || edgeSpaces) {
      verdict = { tone: 'attention', label: 'Hay detalles que revisar', detail: 'No todo lo señalado tiene que ser un problema. Revisa el contexto de los avisos.' };
    } else {
      verdict = { tone: 'clear', label: 'Sin patrones evidentes', detail: 'Estas reglas no han encontrado avisos. Eso no garantiza que la contraseña sea segura.' };
    }

    // Los tipos se muestran como información; no se exige mezclar los cuatro.
    return { length, types: getTypes(password), verdict, checks };
  }

  return { analyzePassword };
})();

if (typeof window !== 'undefined') window.AnthlabAnalyzer = AnthlabAnalyzer;
if (typeof module !== 'undefined' && module.exports) module.exports = AnthlabAnalyzer;
