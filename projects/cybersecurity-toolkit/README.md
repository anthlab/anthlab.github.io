# Toolkit de Ciberseguridad

Proyecto personal que estoy desarrollando para practicar JavaScript y aplicar algunos conceptos de ciberseguridad de una forma más práctica.

Durante este tiempo he estado puliendo mi portfolio y quería empezar a añadir proyectos propios que pudiera ir mejorando poco a poco. De ahí salió la idea de crear este toolkit.

No quiero llenarlo desde el principio de herramientas sin terminar. Mi idea es empezar con cosas pequeñas, entender bien cómo funcionan y añadirlas cuando estén listas.

## Estado actual

Por ahora el toolkit incluye un **generador de contraseñas** hecho con HTML, CSS y JavaScript.

Es la primera herramienta del proyecto y me ha servido para trabajar con generación aleatoria, manipulación del DOM, portapapeles y algunas decisiones relacionadas con seguridad y privacidad en el navegador.

## Generador de contraseñas

Permite:

- elegir una longitud entre 8 y 64 caracteres;
- seleccionar mayúsculas, minúsculas, números y símbolos;
- excluir caracteres que pueden confundirse, como `O`, `0`, `I`, `l`, `1` y `|`;
- mostrar u ocultar la contraseña;
- copiarla al portapapeles;
- ver una estimación aproximada de los bits de entropía.

Todo funciona directamente en el navegador. No hay backend ni se envía la contraseña a ningún servidor.

## Cómo funciona

Para generar los valores aleatorios utilizo:

```javascript
crypto.getRandomValues()
```

En lugar de usar `Math.random()`, preferí utilizar la API criptográfica del navegador porque está pensada para generar valores aleatorios de mayor calidad.

El generador coloca primero un carácter de cada grupo que haya seleccionado el usuario, completa las posiciones restantes con caracteres aleatorios y finalmente mezcla el resultado.

La cifra de bits que aparece en pantalla es una estimación basada en la longitud de la contraseña y el número de caracteres disponibles.

No pretende indicar exactamente cuánto tardaría alguien en romper una contraseña, simplemente sirve como referencia.

## Privacidad

Una de las cosas que quería mantener desde el principio era que la herramienta funcionara de forma local.

Actualmente:

- no hay cuentas de usuario;
- no hay base de datos;
- no guardo las contraseñas;
- no utilizo analítica;
- no hay peticiones a APIs externas;
- la generación se realiza completamente en el navegador.

Al utilizar el botón **Copiar**, la contraseña pasa al portapapeles del sistema. Dependiendo del navegador o sistema operativo, podría permanecer en su historial.

También añadí una Content Security Policy sencilla para evitar conexiones externas desde la página.

## Pruebas

He añadido algunas pruebas básicas para comprobar el funcionamiento del generador.

Entre otras cosas comprueban que:

- la longitud generada sea la correcta;
- se respeten los tipos de caracteres seleccionados;
- funcionen los caracteres excluidos;
- se produzca un error si no se selecciona ningún tipo de carácter.

Las pruebas se pueden ejecutar con Node.js:

```bash
node --test tests/password-generator.test.js
```

## Próximos pasos

El proyecto todavía está en desarrollo.

Mi idea es ir convirtiéndolo poco a poco en una colección de pequeñas herramientas relacionadas con seguridad y redes.

Las siguientes que me gustaría desarrollar son:

- **Analizador de contraseñas**  
  Comprobar longitud, variedad de caracteres y algunos patrones habituales para mostrar información sobre la fortaleza de una contraseña.

- **Analizador de IP**  
  Mostrar información básica sobre una dirección IP y practicar conceptos relacionados con direccionamiento y redes.

- **Analizador de red**  
  Crear alguna herramienta sencilla relacionada con subredes, rangos de direcciones y otros conceptos que estoy estudiando.

- **Analizador de URLs**  
  Revisar una URL y señalar algunos elementos que pueden resultar sospechosos, como dominios extraños, uso de IPs, subdominios o determinadas estructuras.

Prefiero desarrollar cada herramienta por separado y añadirla al toolkit cuando tenga una versión que funcione y que pueda explicar bien.

## Estructura del proyecto

```text
cybersecurity-toolkit/
│
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   └── password-generator.js
├── tests/
│   └── password-generator.test.js
└── README.md
```

### Archivos principales

`index.html`  
Interfaz principal del toolkit.

`css/style.css`  
Estilos de la página.

`js/password-generator.js`  
Lógica relacionada con la generación de contraseñas.

`js/main.js`  
Interacción de la interfaz, botones y portapapeles.

`tests/password-generator.test.js`  
Pruebas básicas del generador.

## Ejecutarlo en local

Yo lo estoy probando con XAMPP.

Copia el proyecto dentro de:

```text
C:\xampp\htdocs\
```

Inicia Apache y abre:

```text
http://localhost/cybersecurity-toolkit/
```

No necesita MySQL ni ninguna configuración adicional.

También puede ejecutarse directamente como una web estática.

## Tecnologías

- HTML
- CSS
- JavaScript
- Web Crypto API
- Clipboard API
- Node.js para las pruebas

## Lo que quiero sacar de este proyecto

Más que hacer una herramienta enorme, estoy utilizando este proyecto para practicar.

Quiero que me sirva para entender mejor JavaScript, seguridad web, redes y algunos de los conceptos que estoy viendo mientras continúo mi formación en ciberseguridad.

También quiero acostumbrarme a documentar los cambios, hacer pruebas y mejorar el proyecto mediante pequeñas iteraciones en vez de intentar terminarlo todo de una vez.

## Referencias

- [Web Crypto API — MDN](https://developer.mozilla.org/es/docs/Web/API/Web_Crypto_API)
- [Clipboard API — MDN](https://developer.mozilla.org/es/docs/Web/API/Clipboard_API)

## Portfolio

Puedes ver otros proyectos y más información sobre mí en:

[anthlab.github.io](https://anthlab.github.io/)