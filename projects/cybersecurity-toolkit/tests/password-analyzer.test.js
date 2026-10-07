'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzePassword } = require('../js/password-analyzer.js');
const warns = (analysis, id) => analysis.checks.find((check) => check.id === id)?.warning;

test('detecta contraseñas habituales aunque cambien letras por símbolos', () => {
  for (const password of ['password', 'P@ssw0rd2026!', 'Contraseña2026!']) {
    const result = analyzePassword(password);
    assert.equal(warns(result, 'common'), true);
    assert.equal(result.verdict.tone, 'warning');
  }
});

test('detecta secuencias numéricas, alfabéticas y del teclado en ambos sentidos', () => {
  for (const password of ['clave1234!', 'clave6543!', 'ABCD-clave', 'lkjh-clave', 'qwer-CLAVE']) {
    assert.equal(warns(analyzePassword(password), 'sequence'), true);
  }
});

test('no considera fuertes los caracteres o bloques repetidos por ser largos', () => {
  for (const password of ['a'.repeat(64), 'Ab!'.repeat(10), 'luna-sol-luna-sol-']) {
    const result = analyzePassword(password);
    assert.equal(warns(result, 'repetition'), true);
    assert.equal(result.verdict.tone, 'warning');
  }
});

test('no exige símbolos ni mayúsculas a una frase larga sin patrones detectados', () => {
  const result = analyzePassword('brisa cobre faro nube');
  assert.equal(warns(result, 'length'), false);
  assert.equal(result.verdict.label, 'Sin patrones evidentes');
  assert.deepEqual(result.types, ['Minúsculas', 'Espacios']);
});

test('cuenta caracteres Unicode y reconoce letras, números y símbolos', () => {
  const result = analyzePassword('Áñ7🙂');
  assert.equal(result.length, 4);
  assert.deepEqual(result.types, ['Mayúsculas', 'Minúsculas', 'Números', 'Símbolos']);
  assert.ok(analyzePassword('東京').types.includes('Otras letras'));
});

test('revisa la longitud alrededor del límite de referencia', () => {
  const short = analyzePassword('fR8!kM2#vP6$zA');
  const longer = analyzePassword('fR8!kM2#vP6$zA9');
  assert.equal(short.length, 14);
  assert.equal(warns(short, 'length'), true);
  assert.equal(longer.length, 15);
  assert.equal(warns(longer, 'length'), false);
  assert.match(longer.checks.find((check) => check.id === 'length').detail, /Alcanza/);
  const above = analyzePassword('fR8!kM2#vP6$zA9&');
  assert.match(above.checks.find((check) => check.id === 'length').detail, /Supera/);
});

test('señala posibles años y conserva los espacios de la entrada', () => {
  const result = analyzePassword(' brisa cobre faro 2026 ');
  assert.equal(warns(result, 'year'), true);
  assert.equal(warns(result, 'spaces'), true);
  assert.equal(result.length, [...' brisa cobre faro 2026 '].length);
  assert.equal(analyzePassword(' '.repeat(20)).verdict.label, 'Solo contiene espacios');
});

test('rechaza entradas vacías, demasiado largas o de otro tipo', () => {
  assert.throws(() => analyzePassword(''), /Escribe/);
  assert.throws(() => analyzePassword('a'.repeat(257)), /256/);
  assert.throws(() => analyzePassword(null), TypeError);
  assert.equal(analyzePassword('a'.repeat(256)).length, 256);
});

test('el resultado no incluye la contraseña ni una copia normalizada', () => {
  const password = 'fR8!kM2#vP6$zA9&';
  const result = JSON.stringify(analyzePassword(password));
  assert.ok(!result.includes(password));
  assert.ok(!result.includes(password.toLowerCase()));
});
