/* Cálculos de IPv4 y subredes. La parte de pantalla está en network-ui.js. */
const AnthlabNetwork = (() => {
  'use strict';

  function parseIPv4(value) {
    const octets = String(value).trim().split('.');
    const invalidOctet = octets.some((octet) => {
      return !/^(0|[1-9]\d{0,2})$/.test(octet) || Number(octet) > 255;
    });

    if (octets.length !== 4 || invalidOctet) {
      throw new Error(
        'Introduce cuatro números entre 0 y 255, sin ceros iniciales. Ejemplo: 192.168.1.10.'
      );
    }

    // Paso los cuatro octetos a un número para poder trabajar con los bits.
    return octets.reduce((number, octet) => number * 256 + Number(octet), 0);
  }

  function formatIPv4(number) {
    // Leo cada grupo de 8 bits y lo convierto otra vez a un octeto.
    return [24, 16, 8, 0]
      .map((shift) => (number >>> shift) & 255)
      .join('.');
  }

  function getAddressType(octets) {
    const [first, second, third] = octets;
    const privateAddress = first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168);

    if (privateAddress) return 'Privada';
    if (octets.every((octet) => octet === 255)) return 'Broadcast limitado';
    if (first === 127) return 'Loopback (propio equipo)';
    if (first === 169 && second === 254) return 'Enlace local';

    if (first === 100 && second >= 64 && second <= 127) {
      return 'Espacio compartido (CGNAT)';
    }

    if (first === 192 && second === 0 && third === 0) {
      return 'Uso especial (protocolos IETF)';
    }

    const documentationAddress =
      (first === 192 && second === 0 && third === 2) ||
      (first === 198 && second === 51 && third === 100) ||
      (first === 203 && second === 0 && third === 113);

    if (documentationAddress) return 'Documentación';
    if (first === 198 && (second === 18 || second === 19)) {
      return 'Pruebas de rendimiento';
    }
    if (first >= 224 && first <= 239) return 'Multicast';
    if (first >= 240) return 'Reservada';

    if (first === 0) {
      return octets.every((octet) => octet === 0)
        ? 'No especificada'
        : 'Red actual (uso especial)';
    }

    // No cubro todos los rangos especiales: no doy por hecho que sea pública.
    return 'Fuera de los rangos privados y especiales identificados';
  }

  function analyzeIP(value) {
    const number = parseIPv4(value);
    const ip = formatIPv4(number);
    const octets = ip.split('.').map(Number);
    const binary = octets
      .map((octet) => octet.toString(2).padStart(8, '0'))
      .join('.');

    return {
      ip,
      type: getAddressType(octets),
      binary,
      hex: '0x' + number.toString(16).padStart(8, '0').toUpperCase()
    };
  }

  function calculateSubnet(value, prefixValue) {
    const address = parseIPv4(value);
    const prefixText = String(prefixValue).trim();

    if (!/^(0|[1-9]\d?)$/.test(prefixText) || Number(prefixText) > 32) {
      throw new Error('El prefijo debe ser un entero entre 0 y 32.');
    }

    const prefix = Number(prefixText);
    const total = 2 ** (32 - prefix);

    // La máscara tiene a 1 los bits de red. Trato /0 aparte porque desplazar
    // 32 posiciones en JavaScript se comporta como desplazar 0 posiciones.
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;

    // Con AND (&) conservo los bits de red y pongo a 0 los de host.
    // JavaScript usa enteros con signo en estas operaciones: >>> 0 devuelve
    // el resultado sin signo para que las IP altas no salgan como negativas.
    const networkNumber = (address & mask) >>> 0;
    const lastNumber = networkNumber + total - 1;

    // En /31 (punto a punto) y /32 no resto red y broadcast.
    const firstHost = prefix >= 31 ? networkNumber : networkNumber + 1;
    const lastHost = prefix >= 31 ? lastNumber : lastNumber - 1;
    const hosts = prefix >= 31 ? total : total - 2;
    let note;

    if (prefix === 31) {
      note = 'En un enlace punto a punto /31 ambas direcciones pueden ser hosts; no hay broadcast.';
    } else if (prefix === 32) {
      note = 'Un /32 identifica una sola dirección; no hay broadcast.';
    } else {
      note = 'El rango excluye red y broadcast. No indica qué direcciones están ocupadas ni cuál es la puerta de enlace.';
    }

    return {
      network: formatIPv4(networkNumber) + '/' + prefix,
      mask: formatIPv4(mask),
      wildcard: formatIPv4((~mask) >>> 0),
      broadcast: prefix >= 31 ? 'No se usa' : formatIPv4(lastNumber),
      first: formatIPv4(firstHost),
      last: formatIPv4(lastHost),
      total,
      hosts,
      note
    };
  }

  return { parseIPv4, formatIPv4, analyzeIP, calculateSubnet };
})();

if (typeof window !== 'undefined') {
  window.AnthlabNetwork = AnthlabNetwork;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnthlabNetwork;
}
