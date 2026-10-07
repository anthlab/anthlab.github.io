/* Reviso la estructura de la URL sin abrirla ni hacer peticiones. */
const AnthlabURL = (() => {
  'use strict';

  function getOriginalHost(input) {
    // Leo el host antes de que URL convierta formatos como 2130706433.
    const authority = input.slice(input.indexOf('://') + 3).split(/[/?#\\]/)[0];
    const hostWithPort = authority.slice(authority.lastIndexOf('@') + 1);
    if (hostWithPort.startsWith('[')) {
      return hostWithPort.slice(0, hostWithPort.indexOf(']') + 1);
    }
    return hostWithPort.split(':')[0];
  }

  function describeIPFormat(host) {
    const parts = host.toLowerCase().split('.');
    if (parts.some((part) => /^0x[0-9a-f]+$/.test(part))) {
      return 'con números hexadecimales';
    }
    if (parts.some((part) => /^0[0-7]+$/.test(part))) {
      return 'con números octales';
    }
    if (/^\d+$/.test(host)) return 'como un único número decimal';
    if (/%[0-9a-f]{2}/i.test(host)) return 'con caracteres codificados';
    if (parts.length < 4 && parts.every((part) => /^\d+$/.test(part))) {
      return 'con menos de cuatro octetos';
    }
    return 'en un formato alternativo';
  }

  function analyzeURL(value) {
    if (typeof value !== 'string') {
      throw new TypeError('La URL debe ser un texto.');
    }
    if (value.length > 2048) {
      throw new Error('El analizador admite hasta 2048 caracteres.');
    }

    const input = value.trim();
    if (!input) throw new Error('Escribe una URL para analizarla.');
    if (/[\u0000-\u001f\u007f]/.test(input)) {
      throw new Error('La URL contiene saltos de línea o caracteres de control.');
    }
    if (!/^https?:\/\/[^/\\]/i.test(input)) {
      throw new Error('Introduce una URL completa con http:// o https://.');
    }

    let url;
    try {
      // URL separa las partes y normaliza el host, pero no se conecta a él.
      url = new URL(input);
    } catch (err) {
      throw new Error('No se ha podido leer la URL. Revisa el host y el puerto.');
    }

    const host = url.hostname;
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
    const ipv6 = host.startsWith('[') && host.endsWith(']');
    const findings = [];
    const information = [];

    if (url.protocol === 'http:') {
      findings.push({
        id: 'http',
        label: 'Usa HTTP',
        detail: 'La conexión no usa HTTPS. Evita enviar contraseñas o datos personales por ella.'
      });
    }

    // El texto antes de @ puede parecer un dominio, pero no es el destino.
    if (url.username || url.password) {
      findings.push({
        id: 'credentials',
        label: 'Hay datos antes de @',
        detail: 'La URL incluye un usuario o contraseña. El destino es el host que aparece en el resultado.'
      });
    }

    if (ipv4 || ipv6) {
      findings.push({
        id: 'ip',
        label: 'El destino es una dirección IP',
        detail: 'Usa una IP en lugar de un dominio. Puede ser normal en una red local; comprueba si es el destino esperado.'
      });
    }

    const originalHost = getOriginalHost(input).replace(/\.$/, '');
    if (ipv4 && originalHost !== host) {
      findings.push({
        id: 'obfuscated-ip',
        label: 'IP escrita en un formato alternativo',
        detail: `${originalHost} se interpreta como ${host}. Está escrito ` +
          `${describeIPFormat(originalHost)}. Este formato puede ocultar el destino a simple vista.`
      });
    }

    if (host.split('.').some((part) => part.startsWith('xn--'))) {
      findings.push({
        id: 'punycode',
        label: 'Dominio en punycode',
        detail: 'El host usa xn-- para representar un nombre internacional. Revisa el nombre: algunos caracteres pueden parecerse a otros.'
      });
    }

    if (!ipv4 && !ipv6 && host.replace(/\.$/, '').split('.').length >= 5) {
      findings.push({
        id: 'host-depth',
        label: 'El host tiene muchas partes',
        detail: 'Lee el host completo. Que el nombre de una web aparezca al principio no significa que le pertenezca.'
      });
    }

    if (url.port) {
      findings.push({
        id: 'port',
        label: 'Puerto distinto del habitual',
        detail: 'La URL especifica un puerto diferente del predeterminado para HTTP o HTTPS. Puede ser un servicio de pruebas.'
      });
    }

    // Codificar espacios o acentos es normal: lo muestro como información.
    if (/%[0-9a-f]{2}/i.test(input)) {
      information.push({
        id: 'encoded',
        label: 'Hay caracteres codificados',
        detail: 'Códigos como %20 representan espacios u otros caracteres. Esto es habitual y no genera un aviso por sí solo.'
      });
    }

    if (input.includes('\\')) {
      findings.push({
        id: 'backslash',
        label: 'Hay barras invertidas',
        detail: 'El navegador puede interpretarlas como barras normales. Comprueba el host y la ruta del resultado.'
      });
    }

    // No incluyo el usuario o la contraseña en los datos que muestro.
    return {
      protocol: url.protocol.slice(0, -1).toUpperCase(),
      hostname: host,
      port: url.port || (url.protocol === 'https:' ? '443 (por defecto)' : '80 (por defecto)'),
      path: url.pathname,
      query: url.search || 'Sin parámetros',
      fragment: url.hash || 'Sin fragmento',
      parameters: [...url.searchParams].length,
      findings,
      information
    };
  }

  return { analyzeURL };
})();

if (typeof window !== 'undefined') {
  window.AnthlabURL = AnthlabURL;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnthlabURL;
}
