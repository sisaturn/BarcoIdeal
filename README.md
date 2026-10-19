# BarcoIdeal (nombre provisional)

Web estática para ayudar a elegir el primer barco de recreo en España:

- **Test** “¿Qué barco me conviene?” (`/test/`): 10 preguntas y un recomendador por reglas transparente.
- **Calculadora** de coste anual (`/calculadora/`): desglose editable, total anual y mensual, gráfico y comparador
  **¿comprar o alquilar?** (`/calculadora/#comprar-o-alquilar`).
- **Fichas de barcos** (`/barcos/` y `/barcos/<tipo>/`): para quién es cada tipo, titulación y coste por zona.
- **Fichas de titulaciones** (`/titulaciones/` y `/titulaciones/<titulación>/`): qué permite cada una y qué barcos.
- **Ayuda personalizada** (`/ayuda/`): formulario conectado a Formspree que adjunta lo hecho en el test o la calculadora.
- **Páginas legales** (`/privacidad/`, `/aviso-legal/`) como plantillas y página de **seguridad** (`/seguridad/`).

La seguridad (CSP, cabeceras, validación, protección del formulario, CI) está explicada en [SEGURIDAD.md](SEGURIDAD.md),
junto con la lista de cosas que tienes que configurar en tus cuentas.

Hecha con Astro 7, Tailwind CSS 4 y Preact. Sin backend, sin cookies de seguimiento.

## Arrancar en local

Requiere Node 22.22 o superior (recomendado Node 24).

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # comprueba tipos y genera /dist
npm run preview    # sirve /dist en local
```

Otros comandos:

| Comando              | Qué hace                                                                  |
| -------------------- | ------------------------------------------------------------------------- |
| `npm run todos`      | Lista todas las cifras y datos marcados con `TODO verificar`              |
| `npm run imagenes`   | Regenera `og-default.png` y `apple-touch-icon.png` (si cambias el nombre) |
| `npm run format`     | Formatea el código con Prettier                                           |
| `npm run check`      | Solo la comprobación de tipos                                             |
| `npm test`           | Tests de la lógica (recomendador, calculadora, comparador, estado)        |
| `npm run test:watch` | Los mismos tests, repitiéndose al guardar cambios                         |

> Los tests (carpeta `tests/`) comprueban relaciones y no cifras concretas: puedes cambiar los importes de
> `costes.ts`, `alquiler.ts` o `tiposBarco.ts` sin tocarlos. Si un cambio de puntos en `REGLAS` hace fallar
> un perfil del test de recomendador, revisa si el resultado nuevo tiene sentido antes de ajustar el test.

> Si añades un componente nuevo y sus estilos no aparecen en `npm run dev`, reinicia el servidor de desarrollo.

## Dónde se cambia cada cosa

| Quiero cambiar…                               | Archivo                                              |
| --------------------------------------------- | ---------------------------------------------------- |
| Nombre de la web, email, titular              | `src/config.ts`                                      |
| URL pública (sitemap, canónicas, Open Graph)  | `astro.config.mjs` → `SITE_URL`                      |
| Textos de inicio, “Sobre mí”, página de ayuda | `src/data/textos.ts`                                 |
| Tipos de barco (textos, esloras, precios)     | `src/data/tiposBarco.ts`                             |
| Preguntas del test                            | `src/data/preguntas.ts`                              |
| Puntuaciones del recomendador                 | `src/data/recomendador.ts`                           |
| Amarres (precio de mercado)                   | `src/data/amarres.ts`                                |
| Mantenimiento y combustible (mercado)         | `src/data/mantenimiento.ts`                          |
| Seguro (legal + mercado)                      | `src/data/seguro.ts`                                 |
| Inspección (legal)                            | `src/data/inspeccion.ts`                             |
| Impuestos y registro (legal)                  | `src/data/impuestos.ts`                              |
| Fuentes y fecha de verificación               | `src/data/fuentes.ts`                                |
| Precios de alquiler y amortización            | `src/data/alquiler.ts`                               |
| Dominios externos permitidos (CSP)            | `astro.config.mjs` → `security.csp`                  |
| Cabeceras de seguridad y caché                | `public/_headers`                                    |
| Titulaciones náuticas                         | `src/data/titulaciones.ts`                           |
| Política de privacidad y aviso legal          | `src/pages/privacidad.astro`, `aviso-legal.astro`    |
| Fotos de los barcos y sus créditos            | `src/assets/barcos/<tipo>.jpg` y `src/data/fotos.ts` |
| Foto de fondo de la portada                   | `src/assets/fondo-yate.jpg`                          |
| Colores y tipografía                          | `src/styles/global.css` (bloque `@theme`)            |

## Estructura

```
src/
├─ config.ts            nombre, email, Formspree, prefijo de almacenamiento
├─ data/                todo el contenido editable (sin código de interfaz)
├─ lib/                 cálculo de costes, comparador, estado (localStorage validado), fichas, iconos, formato
├─ islands/             componentes interactivos en Preact (test, calculadora, comparador, gráfico, formulario)
├─ components/          piezas estáticas (cabecera, pie, avisos, olas, migas, iconos de barco)
├─ layouts/             plantilla común con SEO y Open Graph
└─ pages/               una página por ruta (+ barcos/[tipo], titulaciones/[slug], robots.txt, .well-known/security.txt)
scripts/                generación de imágenes y listado de TODO
public/                 favicon, imagen OG, _headers de Cloudflare
.github/                CI (build + npm audit + tests) y Dependabot
```

## Formspree

1. Crea una cuenta en [formspree.io](https://formspree.io) y un formulario nuevo.
2. Copia el endpoint (`https://formspree.io/f/xxxxxxxx`).
3. En local: copia `.env.example` como `.env` y pon `PUBLIC_FORMSPREE_ENDPOINT=…`.
4. En Cloudflare Pages: añade la misma variable (ver abajo).

Mientras no esté configurado, el formulario muestra un aviso de “modo prototipo” y no envía nada.
Revisa los límites del plan gratuito de Formspree.

## Desplegar en Cloudflare desde GitHub

El repositorio ya está en GitHub (`sisaturn/BarcoIdeal`). El despliegue usa **Cloudflare Workers con archivos
estáticos**: el archivo `wrangler.jsonc` le dice a Cloudflare que solo publique la carpeta `dist`.

1. En el panel de Cloudflare: **Workers & Pages → Create → Import a repository** (o el proyecto `barcoideal`
   que ya tienes) y elige `sisaturn/BarcoIdeal`.
2. Configuración de la build:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Root directory: vacío
3. **Variables de la build** (_Settings → Build → Variables and secrets_):
   `PUBLIC_FORMSPREE_ENDPOINT = https://formspree.io/f/xxxxxxxx`. La versión de Node se toma de `.node-version`.
4. Al desplegar tendrás una URL `https://barcoideal.<tu-subdominio>.workers.dev`. Pon esa URL (o tu dominio propio)
   en `astro.config.mjs` (`SITE_URL`), haz commit y push: cada push a `main` vuelve a desplegar solo.
5. Opcional:
   - **Dominio propio:** _Settings → Domains & Routes_ del proyecto (y actualiza `SITE_URL`).
   - **Analítica sin cookies:** Web Analytics en el panel de Cloudflare, o descomenta el snippet de
     `src/layouts/BaseLayout.astro` y pon tu token en lugar de `CF_ANALYTICS_TOKEN`.

> No añadas el adaptador `@astrojs/cloudflare`: la web es estática y no lo necesita. Si Cloudflare propone
> configurarlo, es que falta `wrangler.jsonc` en el repositorio.
>
> Las variables `PUBLIC_*` se incrustan al compilar: si cambias el endpoint de Formspree, vuelve a desplegar.

## Aviso

Regla de datos: no se inventa ninguna cifra. Los datos legales (titulaciones, seguro, inspección, impuestos)
vienen de la normativa oficial y van enlazados; los precios son estimaciones orientativas de mercado
(`esMercado: true`). Lo que no tiene dato verificado es `null` con un comentario `TODO:` que dice qué falta
y dónde consultarlo. Lista completa: `npm run todos`.
