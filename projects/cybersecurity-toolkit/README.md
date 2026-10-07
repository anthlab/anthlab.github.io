# Toolkit de Ciberseguridad

Versión **1.0.0**: las cuatro herramientas ya están disponibles.

Proyecto personal para practicar JavaScript y aplicar conceptos de seguridad y redes que estoy estudiando.

Durante este tiempo he estado puliendo mi portfolio y quería empezar a añadir proyectos propios que pudiera ir mejorando poco a poco. De ahí salió la idea de crear este toolkit.

## Qué incluye

Por ahora tiene cuatro herramientas, hechas con HTML, CSS y JavaScript:

- **Generador de contraseñas.** Permite elegir la longitud y los tipos de caracteres.
- **Analizador de contraseñas.** Revisa la longitud y busca algunos patrones sencillos.
- **IP y subredes.** Clasifica una IPv4 y calcula su subred a partir de un prefijo CIDR.
- **Analizador de URLs.** Separa una dirección web y señala detalles para revisar.

Puedes cambiar entre ellas desde el menú sin recargar la página. Los cálculos se hacen en el navegador y no necesitan un backend.

## Generador de contraseñas

Permite elegir entre 8 y 64 caracteres, combinar mayúsculas, minúsculas, números y símbolos, y excluir caracteres que pueden confundirse, como `O`, `0`, `I`, `l`, `1` y `|`. También puedes mostrar, ocultar y copiar el resultado.

Uso `crypto.getRandomValues()` para obtener los valores aleatorios. Primero coloco un carácter de cada grupo seleccionado, completo las posiciones restantes y después mezclo el resultado para que los primeros caracteres no tengan siempre el mismo tipo.

### La cifra de bits

Uso la longitud y la cantidad de caracteres disponibles para calcular:

```text
longitud × log₂(caracteres disponibles)
```

La cuenta es aproximada. No tiene en cuenta que meto un carácter de cada tipo ni que algunas combinaciones salen más que otras. Por eso puede marcar más bits de los que realmente aporta el generador, sobre todo con contraseñas cortas. No indica cuánto tardarían en adivinarla.

## Analizador de contraseñas

Escribes una contraseña de prueba y muestra lo que encuentra. La entrada está oculta al principio y puedes mostrarla o borrarla.

Revisa la longitud, una lista pequeña de contraseñas habituales, sustituciones como `@` por `a`, secuencias numéricas o del teclado, repeticiones, posibles años y espacios en los extremos.

He usado 15 caracteres como referencia, siguiendo el apartado de contraseñas usadas como único factor de [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html#passwordver). Aquí sirve para orientar la revisión; no comprueba si un sistema cumple esa norma. Los tipos de caracteres se muestran como información, sin exigir que una frase larga mezcle los cuatro.

### Límites

La lista de ejemplos es pequeña. No consulta filtraciones, no comprueba reutilización ni conoce datos personales. Que no haya avisos no garantiza que una contraseña sea segura.

También puede señalar una contraseña creada por el propio generador: tres caracteres iguales seguidos o un número con aspecto de año pueden aparecer por casualidad. Un aviso no demuestra que la contraseña se haya generado mal. Las reglas reconocen patrones, pero no saben cómo se eligió la entrada.

Admite hasta 256 caracteres. Cuenta los espacios sin recortarlos y, para buscar patrones, ignora mayúsculas y acentos. La contraseña que has escrito no se modifica.

## IP y subredes

La añadí para repasar redes. Escribes una IPv4 y un prefijo de 0 a 32, y puedes ver a qué subred pertenece.

Muestra:

- el tipo de IP, sus bits y su valor en hexadecimal;
- la red, máscara, máscara inversa y broadcast;
- el primer y último host, y cuántas direcciones hay.

Distingo las IP privadas y varios rangos especiales, como loopback, CGNAT o multicast. La lista no está completa: si no reconozco un rango, no doy por hecho que la IP se pueda usar en Internet.

### Un ejemplo

Con `192.168.1.130 /26` sale esto:

| Dato | Resultado |
| --- | --- |
| Tipo | Privada |
| Red | 192.168.1.128/26 |
| Máscara | 255.255.255.192 |
| Máscara inversa | 0.0.0.63 |
| Broadcast | 192.168.1.191 |
| Primer host | 192.168.1.129 |
| Último host | 192.168.1.190 |
| Direcciones totales | 64 |
| Hosts utilizables | 62 |

Primero paso la IP a un número. Con `IP & máscara` saco la red: conservo los bits de red y pongo a cero los de host.

Uso `>>> 0` para que el resultado no salga negativo, porque JavaScript usa números con signo al hacer operaciones con bits.

### Límites

De momento solo admite IPv4. En `/31` cuento dos hosts para un enlace punto a punto, sin broadcast. En `/32` hay una sola dirección.

El número de hosts sale del cálculo; algunos rangos tienen usos especiales y no se pueden asignar sin más. No compruebo si hay equipos usando esas IP ni cuál es la puerta de enlace.

Todo se calcula en el navegador. No consulto ubicación, propietario, reputación ni conectividad. Si algún día añado una API, lo indicaré y explicaré qué datos se envían.

## Analizador de URLs

Lo añadí para practicar cómo se lee una dirección web. Escribes una URL con `http://` o `https://` y muestra el host de destino, puerto, ruta, consulta y fragmento.

Señala HTTP, datos antes de `@`, IPs como destino, nombres en punycode (`xn--`), hosts con muchas partes, puertos distintos del habitual e IPs escritas en otros formatos. También avisa si hay barras invertidas, porque el navegador puede cambiarlas al leer la dirección.

Por ejemplo, `http://2130706433/` apunta a `127.0.0.1`. Ahora comparo el host escrito con el que lee el navegador y aviso si una IPv4 está en decimal de un solo número, hexadecimal, octal, formato abreviado o con caracteres codificados.

Los códigos como `%20` se muestran como información. Un espacio codificado no cambia por sí solo el resumen a «Hay detalles que revisar».

El botón de ejemplo usa `http://cuenta.example.com@192.0.2.10:8080/iniciar?origen=correo`. Aunque al principio aparezca `cuenta.example.com`, el host es `192.0.2.10`. Así puedo ver por qué conviene leer la dirección entera.

Uso la API `URL` del navegador para separar las partes. Los resultados son texto, sin enlaces. El analizador no abre la web ni envía la dirección a un servicio externo.

### Límites

Admite hasta 2048 caracteres y solo HTTP o HTTPS. No consulta DNS, reputación, certificados, redirecciones ni contenido. Tampoco intenta decidir quién es el propietario de un dominio.

Hay huecos que conozco:

- Solo aviso de un host largo cuando tiene cinco partes o más. `paypal.com.evil.net` tiene cuatro y no activa esa regla.
- `www.shop.example.co.uk` sí la activa, aunque sea un nombre normal. Cuento partes separadas por puntos y no uso una lista de sufijos públicos para saber que `co.uk` va junto.
- No busco posibles redirecciones dentro de parámetros como `?url=https://...`.
- No tengo una lista de acortadores ni aviso por usar `bit.ly`. Tampoco resuelvo a dónde lleva.

Un aviso puede tener una explicación normal: una IP local, un dominio internacional o un puerto de pruebas. No tener avisos tampoco significa que la web sea segura. HTTPS por sí solo no demuestra que una web sea de confianza.

El botón **Borrar** limpia la URL y el resultado. La entrada también se limpia al salir de la página.

## Privacidad

Las contraseñas, las IP y las URLs se procesan en el navegador. La página no guarda las entradas en una base de datos, no usa analítica y no hace peticiones a APIs externas.

La contraseña de prueba no aparece en la URL ni se guarda en el almacenamiento de la página. El botón **Borrar** limpia la entrada y el resultado; también se limpia al salir de la página.

Al usar **Copiar**, la contraseña pasa al portapapeles del sistema y puede permanecer en su historial. La página incluye una Content Security Policy con `connect-src 'none'` para bloquear conexiones externas desde sus scripts.

## Ejecutarlo en local

Yo lo estoy probando con XAMPP. Copia la carpeta `cybersecurity-toolkit` dentro de `C:\xampp\htdocs\`, inicia Apache y abre:

```text
http://localhost/cybersecurity-toolkit/
```

No necesita MySQL ni instalar paquetes. También puedes abrir `index.html` directamente. Para copiar automáticamente al portapapeles, el navegador puede exigir localhost o HTTPS; si no lo permite, la página selecciona la contraseña para copiarla manualmente.

## Archivos del proyecto

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | Página con las cuatro herramientas. |
| `css/style.css` | Colores, paneles y adaptación a distintos tamaños de pantalla. |
| `assets/favicon.svg` | Icono de la pestaña. |
| `js/main.js` | Formulario del generador, portapapeles y navegación. |
| `js/password-generator.js` | Generación aleatoria y resumen de los ajustes. |
| `js/password-analyzer.js` | Reglas del analizador de contraseñas. |
| `js/analyzer-ui.js` | Entrada y resultados del analizador de contraseñas. |
| `js/network.js` | Validación IPv4, clasificación y cálculo de subredes. |
| `js/network-ui.js` | Formulario y resultados de IP y subredes. |
| `js/url-analyzer.js` | Lectura de la URL y comprobaciones de su estructura. |
| `js/url-ui.js` | Formulario, ejemplo y resultados del analizador de URLs. |
| `tests/password-generator.test.js` | Pruebas de generación y ajustes inválidos. |
| `tests/password-analyzer.test.js` | Pruebas de patrones, longitud y casos límite. |
| `tests/network.test.js` | Pruebas de rangos IPv4, entradas inválidas y subredes. |
| `tests/url-analyzer.test.js` | Pruebas de URLs, avisos y entradas inválidas. |
| `README.md` | Explicación del proyecto. |

La lógica de cada herramienta está separada de la pantalla para poder probarla con Node.js. Los resultados se insertan como texto, sin interpretar las entradas como HTML.

## Pruebas

Desde la carpeta del toolkit, con Node.js instalado:

```bash
node --test tests/*.test.js
```

Las pruebas del generador comprueban la longitud, los tipos de caracteres y las exclusiones. Las del analizador usan ejemplos inventados para revisar sus reglas. Las de red cubren rangos como CGNAT, documentación y multicast, además de cálculos de subredes y los casos `/0`, `/31` y `/32`.

Las pruebas de URLs revisan el host de destino, datos antes de `@`, IPs, punycode, puertos, caracteres codificados y entradas que no admite la herramienta.

## Próximos pasos

Con estas cuatro herramientas tengo la primera versión completa del toolkit. Ahora quiero seguir repasando el código y mejorando lo que vaya viendo al usarlo.

## Referencias

- [Web Crypto API — MDN](https://developer.mozilla.org/es/docs/Web/API/Web_Crypto_API)
- [Clipboard API — MDN](https://developer.mozilla.org/es/docs/Web/API/Clipboard_API)
- [NIST SP 800-63B-4 — Contraseñas](https://pages.nist.gov/800-63-4/sp800-63b.html#passwordver)
- [API URL — MDN](https://developer.mozilla.org/en-US/docs/Web/API/URL)
- [WHATWG — Lectura de direcciones IPv4](https://url.spec.whatwg.org/#concept-ipv4-parser)
- [Public Suffix List — Qué es un sufijo público](https://publicsuffix.org/learn/)
- [IANA — Rangos IPv4 de uso especial](https://www.iana.org/assignments/iana-ipv4-special-registry/)

## Portfolio

[anthlab.github.io](https://anthlab.github.io/)
