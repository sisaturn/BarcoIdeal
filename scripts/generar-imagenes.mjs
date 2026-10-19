/**
 * Genera las imágenes estáticas de /public a partir de SVG:
 *   - og-default.png (1200×630) para redes sociales
 *   - apple-touch-icon.png (180×180)
 *
 * Uso:  npm run imagenes
 * Vuelve a ejecutarlo si cambias SITE_NAME o SITE_TAGLINE en src/config.ts.
 * Usa `sharp`, que ya viene instalado como dependencia de Astro.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const raiz = new URL('../', import.meta.url);
const config = readFileSync(new URL('src/config.ts', raiz), 'utf8');
const leer = (nombre) => config.match(new RegExp(`export const ${nombre} = '([^']*)'`))?.[1] ?? '';
const nombre = leer('SITE_NAME') || 'BarcoIdeal';
const lema = leer('SITE_TAGLINE');

const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Parte el lema en dos líneas de longitud parecida. */
function dosLineas(texto) {
  const palabras = texto.split(' ');
  let mejor = [texto, ''];
  let dif = Infinity;
  for (let i = 1; i < palabras.length; i++) {
    const a = palabras.slice(0, i).join(' ');
    const b = palabras.slice(i).join(' ');
    if (Math.abs(a.length - b.length) < dif) {
      dif = Math.abs(a.length - b.length);
      mejor = [a, b];
    }
  }
  return mejor;
}

const [linea1, linea2] = dosLineas(lema);
const fuente = "'Plus Jakarta Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="g" cx="85%" cy="0%" r="80%">
      <stop offset="0" stop-color="#1f4a77"/>
      <stop offset="1" stop-color="#0b1d33"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <g transform="translate(80 80)">
    <circle cx="40" cy="40" r="40" fill="#1f4a77" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2"/>
    <path d="M37.5 15 L37.5 52.5 L18.75 52.5 Z" fill="#ffffff"/>
    <path d="M42.5 22.5 L42.5 52.5 L58.75 52.5 Z" fill="#fb8f5a"/>
    <path d="M15 58.75 H65 L58.75 66.25 H21.25 Z" fill="#ffffff"/>
    <text x="104" y="54" font-family="${fuente}" font-size="40" font-weight="800" fill="#ffffff">${escapar(nombre)}</text>
  </g>
  <text font-family="${fuente}" font-size="64" font-weight="800" fill="#ffffff">
    <tspan x="80" y="330">${escapar(linea1)}</tspan>
    <tspan x="80" y="410">${escapar(linea2)}</tspan>
  </text>
  <text x="80" y="500" font-family="${fuente}" font-size="30" fill="#b9d6ec">Test gratuito · Calculadora de coste anual · España</text>
  <path d="M0 560 Q100 540 200 560 T400 560 T600 560 T800 560 T1000 560 T1200 560 V630 H0 Z" fill="#255c93"/>
  <path d="M0 590 Q100 572 200 590 T400 590 T600 590 T800 590 T1000 590 T1200 590 V630 H0 Z" fill="#1f4a77"/>
  <circle cx="1060" cy="150" r="56" fill="#fb8f5a"/>
</svg>`;

const icono = readFileSync(new URL('public/favicon.svg', raiz));

await sharp(Buffer.from(og))
  .png()
  .toFile(fileURLToPath(new URL('public/og-default.png', raiz)));
const touch = await sharp(icono, { density: 600 })
  .resize(140, 140)
  .extend({ top: 20, bottom: 20, left: 20, right: 20, background: '#ffffff' })
  .png()
  .toBuffer();
writeFileSync(new URL('public/apple-touch-icon.png', raiz), touch);

console.log(`Imágenes generadas para «${nombre}»: public/og-default.png y public/apple-touch-icon.png`);
