/**
 * Acceso a las fotos de src/assets para los componentes de Astro (astro:assets las optimiza en la build).
 * Solo se usa desde archivos .astro: depende de import.meta.glob de Vite.
 */
import type { ImageMetadata } from 'astro';
import type { IdTipoBarco } from '../data/tiposBarco';
import fondoYate from '../assets/fondo-yate.jpg';

const archivos = import.meta.glob<{ default: ImageMetadata }>('../assets/barcos/*.jpg', { eager: true });

/** Foto de un tipo de barco. Falla en la build si falta el archivo (así no se publica una imagen rota). */
export function fotoBarco(id: IdTipoBarco): ImageMetadata {
  const modulo = archivos[`../assets/barcos/${id}.jpg`];
  if (!modulo) throw new Error(`Falta la foto src/assets/barcos/${id}.jpg`);
  return modulo.default;
}

export const fotoFondo: ImageMetadata = fondoYate;
