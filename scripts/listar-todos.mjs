/**
 * Lista todas las cifras y datos marcados con "TODO verificar", agrupados por archivo.
 * Uso:  npm run todos
 * Ejecútalo cuando quieras para ver lo que te queda por revisar.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const MARCAS = /TODO verificar|\[VERIFICAR|TODO:|TODO verificar con fuente oficial/;

function recorrer(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? recorrer(ruta) : [ruta];
  });
}

let total = 0;
for (const archivo of recorrer(join(raiz, 'src')).filter((f) => /\.(ts|tsx|astro)$/.test(f))) {
  const lineas = readFileSync(archivo, 'utf8').split('\n');
  const encontrados = lineas
    .map((texto, i) => ({ n: i + 1, texto: texto.trim() }))
    .filter((l) => MARCAS.test(l.texto) && !l.texto.includes('`TODO'));
  if (!encontrados.length) continue;
  console.log(`\n${relative(raiz, archivo)}  (${encontrados.length})`);
  for (const l of encontrados) console.log(`  ${String(l.n).padStart(4)}  ${l.texto.slice(0, 140)}`);
  total += encontrados.length;
}
console.log(`\nTotal: ${total} puntos por revisar.`);
