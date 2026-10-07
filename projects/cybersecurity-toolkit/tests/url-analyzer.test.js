'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeURL } = require('../js/url-analyzer.js');
const hasFinding = (result, id) => result.findings.some((finding) => finding.id === id);

test('rechaza entradas vacías, protocolos no admitidos y URLs incompletas', () => {
  const invalid = [
    '', '   ', 'example.com', '/ruta', '//example.com',
    'https:example.com', 'https:///example.com', 'https://',
    'ftp://example.com', 'javascript:alert(1)', 'data:text/html,hola',
    'https://example.com:99999', 'https://ex\tample.com'
  ];
  for (const input of invalid) {
    assert.throws(() => analyzeURL(input), undefined, input);
  }
  assert.throws(() => analyzeURL(null), TypeError);
  assert.throws(() => analyzeURL('https://example.com/' + 'a'.repeat(2048)), /2048/);
});

test('separa las partes y normaliza el host y el puerto predeterminado', () => {
  const result = analyzeURL('  HTTPS://EXAMPLE.COM:443/ruta?tema=red&tema=web#parte  ');
  assert.equal(result.protocol, 'HTTPS');
  assert.equal(result.hostname, 'example.com');
  assert.equal(result.port, '443 (por defecto)');
  assert.equal(result.path, '/ruta');
  assert.equal(result.query, '?tema=red&tema=web');
  assert.equal(result.fragment, '#parte');
  assert.equal(result.parameters, 2);
  assert.deepEqual(result.findings, []);
});

test('señala HTTP sin tratar HTTPS como garantía de confianza', () => {
  assert.equal(hasFinding(analyzeURL('http://example.com'), 'http'), true);
  const https = analyzeURL('https://example.com');
  assert.equal(hasFinding(https, 'http'), false);
  assert.equal(https.query, 'Sin parámetros');
  assert.equal(https.fragment, 'Sin fragmento');
});

test('identifica el host después de @ y no devuelve las credenciales', () => {
  const result = analyzeURL('https://cuenta.example.com:claveInventada@destino.example/ruta');
  assert.equal(result.hostname, 'destino.example');
  assert.equal(hasFinding(result, 'credentials'), true);
  assert.equal(JSON.stringify(result).includes('claveInventada'), false);
  const ordinary = analyzeURL('https://example.com/ruta@correo?email=uno@example.com');
  assert.equal(hasFinding(ordinary, 'credentials'), false);
});

test('reconoce IPv4, IPv6 y una IPv4 escrita como número hexadecimal', () => {
  const cases = [
    ['https://192.0.2.10/ruta', '192.0.2.10'],
    ['http://[::1]:8080/', '[::1]'],
    ['http://0x7f000001/', '127.0.0.1']
  ];
  for (const [input, host] of cases) {
    const result = analyzeURL(input);
    assert.equal(result.hostname, host);
    assert.equal(hasFinding(result, 'ip'), true);
  }
});

test('reconoce punycode escrito directamente o a partir de Unicode', () => {
  for (const input of ['https://bücher.example', 'https://xn--bcher-kva.example']) {
    const result = analyzeURL(input);
    assert.equal(result.hostname, 'xn--bcher-kva.example');
    assert.equal(hasFinding(result, 'punycode'), true);
  }
});

test('señala hosts con muchas partes sin inventar un dominio principal', () => {
  const result = analyzeURL('https://marca.login.cuentas.example.co.uk/');
  assert.equal(result.hostname, 'marca.login.cuentas.example.co.uk');
  assert.equal(hasFinding(result, 'host-depth'), true);
  assert.equal(hasFinding(analyzeURL('https://www.example.co.uk'), 'host-depth'), false);
});

test('distingue los puertos habituales de los puertos alternativos', () => {
  assert.equal(hasFinding(analyzeURL('http://example.com:80'), 'port'), false);
  assert.equal(hasFinding(analyzeURL('https://example.com:443'), 'port'), false);
  const alternative = analyzeURL('https://example.com:8443');
  assert.equal(alternative.port, '8443');
  assert.equal(hasFinding(alternative, 'port'), true);
});

test('muestra los códigos porcentuales como información sin cambiar el resumen', () => {
  const result = analyzeURL('https://example.com/%252F?destino=%2Fcuenta');
  assert.equal(result.path, '/%252F');
  assert.equal(result.query, '?destino=%2Fcuenta');
  assert.deepEqual(result.findings, []);
  assert.equal(result.information.some((item) => item.id === 'encoded'), true);
  const ordinary = analyzeURL('https://example.com/una%20ruta');
  assert.deepEqual(ordinary.findings, []);
  assert.equal(ordinary.information.length, 1);
});

test('muestra el host que interpreta URL cuando hay una barra invertida', () => {
  const result = analyzeURL('https://example.com\\@otra.example/ruta');
  assert.equal(result.hostname, 'example.com');
  assert.equal(result.path, '/@otra.example/ruta');
  assert.equal(hasFinding(result, 'backslash'), true);
  assert.equal(hasFinding(result, 'credentials'), false);
});


test('avisa de IPv4 en decimal, hexadecimal, octal, abreviadas y codificadas', () => {
  const cases = [
    ['2130706433', 'decimal'],
    ['0x7f000001', 'hexadecimales'],
    ['0177.0.0.1', 'octales'],
    ['127.1', 'menos de cuatro octetos'],
    ['%31%32%37.0.0.1', 'codificados']
  ];
  for (const [host, format] of cases) {
    const result = analyzeURL('https://' + host + '/');
    const finding = result.findings.find((item) => item.id === 'obfuscated-ip');
    assert.equal(result.hostname, '127.0.0.1');
    assert.ok(finding, host);
    assert.ok(finding.detail.includes(host));
    assert.ok(finding.detail.includes('127.0.0.1'));
    assert.ok(finding.detail.includes(format));
  }
});

test('extrae el host original sin confundirlo con usuario, puerto, ruta o consulta', () => {
  const result = analyzeURL('https://uno@cuenta.example:clave@2130706433:8443/ruta?url=https://otro.example#parte');
  const finding = result.findings.find((item) => item.id === 'obfuscated-ip');
  assert.equal(result.hostname, '127.0.0.1');
  assert.ok(finding.detail.includes('2130706433'));
  assert.equal(finding.detail.includes('8443'), false);
  assert.equal(finding.detail.includes('cuenta.example'), false);
  assert.equal(JSON.stringify(result).includes('clave'), false);
});

test('no confunde IPv4 normales, un punto final, IPv6 o dominios con IPs ofuscadas', () => {
  const cases = [
    'https://127.0.0.1:443/',
    'https://127.0.0.1./',
    'https://127.0.0.1/una%20ruta?ip=2130706433',
    'https://[0:0:0:0:0:0:0:1]/',
    'https://EXAMPLE.COM/',
    'https://bücher.example/'
  ];
  for (const input of cases) {
    assert.equal(hasFinding(analyzeURL(input), 'obfuscated-ip'), false, input);
  }
});

test('recoge los huecos documentados sobre hosts largos, parámetros y acortadores', () => {
  assert.deepEqual(analyzeURL('https://paypal.com.evil.net/').findings, []);
  assert.equal(hasFinding(analyzeURL('https://www.shop.example.co.uk/'), 'host-depth'), true);
  assert.deepEqual(analyzeURL('https://example.com/?url=https://otro.example/').findings, []);
  assert.deepEqual(analyzeURL('https://bit.ly/ejemplo').findings, []);
});
