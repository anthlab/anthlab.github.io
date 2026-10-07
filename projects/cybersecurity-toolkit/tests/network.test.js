'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../js/network.js');

const unidentified = 'Fuera de los rangos privados y especiales identificados';

test('rechaza octetos y prefijos inválidos', () => {
  const invalidAddresses = [
    '', '1.2.3', '256.1.1.1', '01.2.3.4', '1.2.3.-1', '1.2.3.4/24'
  ];

  for (const address of invalidAddresses) {
    assert.throws(() => api.parseIPv4(address));
  }
  for (const prefix of ['', -1, 33, 2.5, 'abc']) {
    assert.throws(() => api.calculateSubnet('1.2.3.4', prefix));
  }
});

test('distingue las privadas de direcciones fuera de esos rangos', () => {
  const privateAddresses = [
    '10.0.0.0', '10.255.255.255', '172.16.0.0',
    '172.31.255.255', '192.168.0.0', '192.168.255.255'
  ];

  for (const address of privateAddresses) {
    assert.equal(api.analyzeIP(address).type, 'Privada');
  }
  for (const address of ['172.15.255.255', '172.32.0.0', '192.169.0.0']) {
    assert.equal(api.analyzeIP(address).type, unidentified);
  }
});

test('reconoce loopback, enlace local y broadcast limitado', () => {
  assert.equal(api.analyzeIP('127.0.0.1').type, 'Loopback (propio equipo)');
  assert.equal(
    api.analyzeIP('127.0.0.1').binary,
    '01111111.00000000.00000000.00000001'
  );
  assert.equal(api.analyzeIP('169.254.1.10').type, 'Enlace local');
  assert.equal(api.analyzeIP('255.255.255.255').type, 'Broadcast limitado');
  assert.equal(api.analyzeIP('255.255.255.255').hex, '0xFFFFFFFF');
});

test('reconoce los extremos de CGNAT sin incluir direcciones vecinas', () => {
  for (const address of ['100.64.0.0', '100.127.255.255']) {
    assert.equal(api.analyzeIP(address).type, 'Espacio compartido (CGNAT)');
  }
  for (const address of ['100.63.255.255', '100.128.0.0']) {
    assert.equal(api.analyzeIP(address).type, unidentified);
  }
});

test('reconoce los tres bloques de documentación', () => {
  const addresses = [
    '192.0.2.0', '192.0.2.255', '198.51.100.0',
    '198.51.100.255', '203.0.113.0', '203.0.113.255'
  ];

  for (const address of addresses) {
    assert.equal(api.analyzeIP(address).type, 'Documentación');
  }
  assert.equal(api.analyzeIP('203.0.114.0').type, unidentified);
});

test('identifica el bloque de protocolos IETF como uso especial', () => {
  for (const address of ['192.0.0.0', '192.0.0.9', '192.0.0.10', '192.0.0.255']) {
    assert.equal(api.analyzeIP(address).type, 'Uso especial (protocolos IETF)');
  }
  assert.equal(api.analyzeIP('192.0.1.0').type, unidentified);
});

test('reconoce multicast y su límite con el espacio reservado', () => {
  for (const address of ['224.0.0.0', '224.0.0.1', '239.255.255.255']) {
    assert.equal(api.analyzeIP(address).type, 'Multicast');
  }
  assert.equal(api.analyzeIP('223.255.255.255').type, unidentified);
  assert.equal(api.analyzeIP('240.0.0.0').type, 'Reservada');
});

test('calcula una /24 y una /26 con el bit más alto activo', () => {
  const subnet = api.calculateSubnet('192.168.1.130', 26);

  assert.equal(subnet.network, '192.168.1.128/26');
  assert.equal(subnet.broadcast, '192.168.1.191');
  assert.equal(subnet.first, '192.168.1.129');
  assert.equal(subnet.last, '192.168.1.190');
  assert.equal(subnet.hosts, 62);
  assert.equal(subnet.mask, '255.255.255.192');
  assert.equal(subnet.wildcard, '0.0.0.63');
  assert.equal(api.calculateSubnet('192.168.1.10', 24).hosts, 254);
});

test('maneja /0, /31 y /32 sin desbordamiento', () => {
  const all = api.calculateSubnet('255.255.255.255', 0);
  assert.equal(all.network, '0.0.0.0/0');
  assert.equal(all.total, 4294967296);
  assert.equal(all.mask, '0.0.0.0');
  assert.equal(all.wildcard, '255.255.255.255');
  assert.equal(all.last, '255.255.255.254');

  const pair = api.calculateSubnet('10.0.0.5', 31);
  assert.equal(pair.first, '10.0.0.4');
  assert.equal(pair.last, '10.0.0.5');
  assert.equal(pair.hosts, 2);
  assert.equal(pair.broadcast, 'No se usa');

  const single = api.calculateSubnet('255.255.255.255', 32);
  assert.equal(single.first, '255.255.255.255');
  assert.equal(single.first, single.last);
  assert.equal(single.hosts, 1);
  assert.equal(single.broadcast, 'No se usa');
});
