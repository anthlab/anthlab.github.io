# Toolkit de Ciberseguridad

Proyecto personal para practicar JavaScript y aplicar conceptos de seguridad y redes que estoy estudiando.

Durante este tiempo he estado puliendo mi portfolio y quería empezar a añadir proyectos propios que pudiera ir mejorando poco a poco. De ahí salió la idea de crear este toolkit.

## Qué incluye

Por ahora tiene tres herramientas, hechas con HTML, CSS y JavaScript:

- **Generador de contraseñas.** Permite elegir la longitud y los tipos de caracteres.
- **Analizador de contraseñas.** Revisa la longitud y busca algunos patrones sencillos.
- **IP y subredes.** Clasifica una IPv4 y calcula su subred a partir de un prefijo CIDR.

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

## Privacidad

Las contraseñas y las IP se procesan en el navegador. La página no guarda las entradas en una base de datos, no usa analítica y no hace peticiones a APIs externas.

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
| `index.html` | Página con las tres herramientas. |
| `css/style.css` | Colores, paneles y adaptación a distintos tamaños de pantalla. |
| `assets/favicon.svg` | Icono de la pestaña. |
| `js/main.js` | Formulario del generador, portapapeles y navegación. |
| `js/password-generator.js` | Generación aleatoria y resumen de los ajustes. |
| `js/password-analyzer.js` | Reglas del analizador de contraseñas. |
| `js/analyzer-ui.js` | Entrada y resultados del analizador de contraseñas. |
| `js/network.js` | Validación IPv4, clasificación y cálculo de subredes. |
| `js/network-ui.js` | Formulario y resultados de IP y subredes. |
| `tests/password-generator.test.js` | Pruebas de generación y ajustes inválidos. |
| `tests/password-analyzer.test.js` | Pruebas de patrones, longitud y casos límite. |
| `tests/network.test.js` | Pruebas de rangos IPv4, entradas inválidas y subredes. |
| `README.md` | Explicación del proyecto. |

La lógica de cada herramienta está separada de la pantalla para poder probarla con Node.js. Los resultados se insertan como texto, sin interpretar las entradas como HTML.

## Pruebas

Desde la carpeta del toolkit, con Node.js instalado:

```bash
node --test tests/*.test.js
```

Las pruebas del generador comprueban la longitud, los tipos de caracteres y las exclusiones. Las del analizador usan ejemplos inventados para revisar sus reglas. Las de red cubren rangos como CGNAT, documentación y multicast, además de cálculos de subredes y los casos `/0`, `/31` y `/32`.

## Próximos pasos

La siguiente herramienta que quiero añadir es un analizador de URLs, con comprobaciones sencillas de la estructura de una dirección. Mientras tanto, seguiré revisando estas tres herramientas y practicando los conceptos que hay detrás.

## Referencias

- [Web Crypto API — MDN](https://developer.mozilla.org/es/docs/Web/API/Web_Crypto_API)
- [Clipboard API — MDN](https://developer.mozilla.org/es/docs/Web/API/Clipboard_API)
- [NIST SP 800-63B-4 — Contraseñas](https://pages.nist.gov/800-63-4/sp800-63b.html#passwordver)
- [IANA — Rangos IPv4 de uso especial](https://www.iana.org/assignments/iana-ipv4-special-registry/)

## Portfolio

[anthlab.github.io](https://anthlab.github.io/)
