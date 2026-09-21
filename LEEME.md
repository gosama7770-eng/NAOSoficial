# NAOS Electromecánica — web

Web de una sola página (one-page), en **español e inglés**, con un **motor 3D** en la
cabecera hecho con Three.js. Sin frameworks, sin compilación: HTML, CSS y JavaScript.

---

## ⚠️ Antes de publicar: cosas que hay que confirmar

1. **Texto de «Trabajamos vehículos industriales»** — el título es el que pediste; el
   texto de debajo (furgonetas, vehículos comerciales, de reparto…) lo he redactado de
   forma genérica. Si trabajáis camiones, maquinaria o flotas concretas, cámbialo en
   `assets/js/i18n.js` → claves `ind.*` (y el HTML de `index.html`, sección
   `#industriales`).
2. **Teléfono fijo 928 844 658** — lo he puesto solo en el pie de página, como pediste.
   Si ya no se usa, bórralo de `index.html` (busca `footer__land`) y del bloque
   `application/ld+json` del final.
3. **Aviso legal, Privacidad y Cookies** — los enlaces del pie apuntan a `#`.
   Hay que crear esas páginas (obligatorio en España si se recogen datos).
   Ahora mismo la web **no tiene formularios ni cookies propias**, así que el riesgo es
   mínimo, pero el mapa de Google sí carga contenido de terceros.

---

## Cómo ver la web en el ordenador

Doble clic en `index.html` funciona, pero para que todo se vea exactamente como en
internet es mejor levantar el servidor incluido:

```powershell
powershell -ExecutionPolicy Bypass -File "serve.ps1"
```

Y abrir <http://localhost:5173> en el navegador. Se para con `Ctrl + C`.

> ⚠️ Si abres `index.html` desde el enlace del chat de Claude, la app muestra una
> **vista estática** sin estilos, sin imágenes y sin JavaScript (se ve todo en blanco
> con un icono de teléfono enorme). Esa vista no es la web: ahí nada funciona.
> Ábrela con doble clic desde la carpeta (Chrome o Edge) o con el servidor de arriba.

---

## Cómo publicarla

Sube **todo el contenido de esta carpeta** (menos `serve.ps1` y `LEEME.md`, que son
solo para trabajar en local) a la raíz del hosting. Funciona en cualquier alojamiento
estático: Hostinger, Ionos, Netlify, Vercel, GitHub Pages…

Después, en `index.html`, cambia esta línea por el dominio real:

```html
<link rel="canonical" href="https://www.naoselectromecanica.es/">
```

---

## Dónde se cambia cada cosa

| Qué quieres cambiar | Archivo |
|---|---|
| Cualquier texto (ES y EN) | `assets/js/i18n.js` |
| Estructura, teléfonos, enlaces, mapa | `index.html` |
| Colores, tipografías, espaciados | `assets/css/styles.css` (bloque `:root`) |
| El motor 3D | `assets/js/engine3d.js` |
| Fotos | `assets/img/` |

### Textos

Todos los textos viven en `assets/js/i18n.js`, en dos bloques: `es:` y `en:`.
Cada texto tiene una clave (por ejemplo `svc.3.d`) que se corresponde con el
atributo `data-i18n` del HTML. Cambia el valor y listo — no toques la clave.

### Idioma por defecto

La web abre **siempre en español**. Si quieres que detecte sola el idioma del
navegador del visitante (útil con el cliente extranjero de Lanzarote), abre
`assets/js/i18n.js` y cambia:

```js
var AUTO_DETECT = false;   →   var AUTO_DETECT = true;
```

### Títulos con palabra destacada

Algunos títulos llevan una parte en trazo fino y verde (por ejemplo
«Sin sorpresas, de principio a fin»). En `i18n.js` esas claves llevan la etiqueta
`<em>…</em>` alrededor de la parte destacada. Si cambias el texto, mantén `<em>`
donde quieras el acento, o quítalo si no lo quieres. Lo mismo con `<strong>` en los
puntos de «Nuestro compromiso» (la frase clave que va en blanco y más grande).

### Tipografías

Criterios de la skill **impeccable** (pbakaus/impeccable): una familia con razón de
ser, nada de fuentes «por defecto» (Inter, IBM Plex, serif en cursiva…), sin etiquetas
pequeñas encima de los títulos, sin texto con degradado y sin cuadrículas de cajas
iguales.

Se usa una sola superfamilia, **Barlow**, diseñada a partir de la señalética de
carretera de California: tiene sentido en un taller del automóvil y su versión
condensada recuerda al «NAOS» del logotipo.

| Uso | Fuente |
|---|---|
| Títulos, cifras, teléfonos | **Barlow Condensed** (600; 300 para la parte destacada) |
| Subtítulos, menú, botones, etiquetas | **Barlow Semi Condensed** (500–600) |
| Texto corrido | **Barlow** (400–600), mínimo 16 px |

Todas son de Google Fonts, gratuitas y con licencia libre.

### La skill «impeccable» (opcional)

Para usarla tú mismo en Claude Code, abre una terminal con `claude` y escribe:

```
/plugin marketplace add pbakaus/impeccable
```

Después instala el plugin desde `/plugin` y úsalo con `/impeccable <comando>`
(por ejemplo `/impeccable critique` o `/impeccable typeset`). Para esta web he
aplicado sus reglas leyéndolas directamente de su repositorio.

### Colores

La paleta sale del **verde exacto del logotipo (#0A803A)**. En `assets/css/styles.css`,
arriba del todo:

```css
--brand:        #0A803A;   /* verde del logotipo */
--green:        #0F8A43;   /* principal: botones, líneas */
--green-bright: #4DB87C;   /* acentos y enlaces sobre fondo oscuro */
--bg:           #070A09;   /* fondo general */
```

### Logotipo

En cabecera y pie se usa **`logo-naos.png`**: solo el emblema (engranaje, pistones y
rayo) y la palabra **NAOS**, sin «electromecánica», sin la barra «MECÁNICA GENERAL» y
sin la curva inferior. Está compuesto a partir del logo original, sin redibujar nada.
No se encoge ni se deforma en ningún ancho de pantalla, y lleva un ligero aclarado
(`filter: brightness(1.2)`) para leerse bien sobre fondo oscuro.

Se conservan también `logo.png` (completo, fondo transparente) y
`logo-original.png` (el archivo que me pasaste).

### Horario «Abierto ahora / Cerrado»

Se calcula solo, **con la hora de Canarias** (no con la del visitante).
Si cambia el horario, hay que tocar tres sitios:
`assets/js/main.js` (`OPEN_MIN` y `CLOSE_MIN`), la tabla de `index.html`
y el bloque `openingHoursSpecification` del JSON-LD.

---

## El motor 3D

Está construido por código (no es un modelo descargado), así que **no hay licencias
de terceros** y el archivo pesa muy poco. Gira solo, en plan cinematográfico, con los
pistones y el cigüeñal moviéndose de verdad según la geometría real de biela-manivela.
Detrás va la rueda dentada del logotipo, mirando siempre de frente, y el rayo rojo.

Ajustes rápidos en `assets/js/engine3d.js`:

- **Velocidad de giro del conjunto**: `spin += dt * 0.17`
- **Revoluciones del motor**: `theta += dt * 2.1`
- **Posición en pantalla**: dentro de `layout()`, `root.position.x`
- **Luz y contraste**: `renderer.toneMappingExposure`

Si el visitante tiene activado «reducir movimiento» en su sistema, el motor se queda
quieto en una pose bonita. Si el navegador no soporta 3D, aparece el emblema NAOS.

### Solicitud de cita (sección final, `#cita`)

Formulario en 4 pasos (servicio, vehículo, día y franja, datos) con un resumen tipo
orden de trabajo que se rellena en vivo. **Funciona sin servidor:** al pulsar
«Enviar solicitud por WhatsApp» se abre WhatsApp al **680 31 01 80** con la cita ya
redactada; el cliente solo pulsa enviar. Los datos no se guardan en ningún sitio.

- **Número de WhatsApp:** en `assets/js/main.js`, `var WA_NUMBER = '34680310180';`
- **Días que se ofrecen:** los próximos 10 días laborables (lunes a viernes) con la
  hora de Canarias; «hoy» solo aparece si aún no son las 12:00. No descuenta
  festivos: por eso el texto dice que es una preferencia y que el taller confirma.
- **Franjas horarias:** en `index.html`, bloque `.slots`.
- **Textos y avisos de error:** claves `book.*` en `assets/js/i18n.js`.
- El botón «Pedir cita» de la cabecera y del menú móvil lleva a esta sección.

Si más adelante preferís recibir las solicitudes **por email**, se puede conectar el
mismo formulario a un servicio gratuito como Formspree o Web3Forms (hace falta crear
una cuenta con el email del taller).

Las piezas 3D que decoran la sección (disco de freno con pinza verde, bujía, llave
combinada, tornillo, tuercas, pistón con biela y engranaje) están en `engine3d.js`,
función `initWorkshop`. Su colocación se ajusta en el objeto `LAYOUT` (`wide` para
ordenador, `compact` para móvil).

### Engranajes 3D de la sección «Nosotros»

Dos ruedas dentadas que engranan de verdad (el mismo paso de diente y velocidades en
proporción inversa al número de dientes): la verde representa la mecánica y la
cromada, con anillo de luz y el rayo del logotipo, la electrónica. Van dentro de una
esfera tipo cuentarrevoluciones. Se ajustan en `engine3d.js`, función `initGears`
(`OMEGA` es la velocidad de giro).

`assets/js/vendor/three.min.js` es la librería Three.js (r149, licencia MIT).
Va incluida en local para que la web funcione aunque el CDN falle; si el archivo no
cargara, `index.html` lo pide a jsDelivr como respaldo.

---

## Fotos usadas

| Archivo | Dónde aparece |
|---|---|
| `fachada-servicios.jpg` | El taller (grande, izquierda) |
| `elevador-taller.jpg` | El taller |
| `motor-v6.jpg` | El taller |
| `electronica-multimedia.jpg` | Servicios (pieza destacada de electrónica) |
| `motor-detalle.jpg` | El taller |
| `range-rover-taller.jpg` | El taller (ancha) |
| `porsche-trasera.jpg` | El taller |
| `taller-fachada.jpg` | Vehículos industriales + imagen para redes sociales |
| `logo-naos.png` | Cabecera y pie (emblema + NAOS) |
| `logo-emblem.png` | Emblema completo y cuadrado: pantalla de carga y sello de la foto de industriales |
| `favicon-48/96/192.png`, `apple-touch-icon.png` | Icono de la pestaña, de Google y del móvil (emblema entero) |
| `logo.png` | Logo completo con fondo transparente (datos para Google) |
| `logo-mark.png` | Icono de pestaña y sello sobre la foto |
| `logo-original.png` | El logotipo tal cual me lo pasaste (copia de seguridad) |

Para cambiar una foto, sustituye el archivo **con el mismo nombre** y actualiza el
texto `alt` en `index.html`.

> Nota: `elevador-taller.jpg` lleva la marca de agua «Hector Aleman Photo» en la
> esquina. Si no tienes los derechos de esa foto, conviene sustituirla.

---

## Detalles técnicos incluidos

- Datos estructurados **schema.org/AutoRepair** (Google puede mostrar dirección,
  teléfono y horario directamente en los resultados).
- Etiquetas Open Graph: al compartir el enlace por WhatsApp sale foto y descripción.
- Accesibilidad: saltar al contenido, foco visible, textos alternativos, menú con
  teclado y respeto por «reducir movimiento».
- Responsive real de 320 px a pantallas grandes.
- Hoja de estilos de impresión (si alguien imprime la página, sale limpia).
- Imágenes con carga diferida (`loading="lazy"`).
