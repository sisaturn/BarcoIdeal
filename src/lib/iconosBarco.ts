/**
 * Iconos de línea de cada tipo de barco (viewBox 0 0 48 48, proa a la izquierda).
 * Los usan IconoBarco.astro (páginas estáticas) e islands/IconoBarco.tsx (componentes interactivos).
 * `relleno: true` pinta la forma con un tono suave (velas, cascos).
 */
import type { IdTipoBarco } from '../data/tiposBarco';

export interface TrazoIcono {
  d: string;
  relleno?: boolean;
}

/** Línea de agua común a todos los iconos. */
export const OLA = 'M3 43c3 0 3-1.6 6-1.6s3 1.6 6 1.6 3-1.6 6-1.6 3 1.6 6 1.6 3-1.6 6-1.6 3 1.6 6 1.6 3-1.6 6-1.6';

export const ICONOS_BARCO: Record<IdTipoBarco, TrazoIcono[]> = {
  semirrigida: [
    { d: 'M7 30h29a5 5 0 0 1 0 10H12a5 5 0 0 1-5-5z', relleno: true },
    { d: 'M18 30v-7h7l2 7' },
    { d: 'M41 27v10' },
  ],
  'lancha-open': [{ d: 'M3 30h41l-3 9H11z', relleno: true }, { d: 'M21 30l3-6h6' }, { d: 'M34 30v-3h5' }],
  'lancha-cabina': [{ d: 'M3 30h41l-3 9H11z', relleno: true }, { d: 'M12 30l4-8h16l4 8' }, { d: 'M18 26h4M26 26h4' }],
  'velero-pequeno': [
    { d: 'M10 35h28l-4 5H14z', relleno: true },
    { d: 'M24 35V7' },
    { d: 'M26 9l10 23H26z', relleno: true },
    { d: 'M22 12l-9 20h9z', relleno: true },
  ],
  'velero-crucero': [
    { d: 'M3 33h42l-5 7H9z', relleno: true },
    { d: 'M15 33v-3h14v3' },
    { d: 'M22 30V4' },
    { d: 'M24 6l13 22H24z', relleno: true },
    { d: 'M20 9L9 28h11z', relleno: true },
  ],
  catamaran: [
    { d: 'M3 36h17l-2 4H6zM28 36h17l-2 4H31z', relleno: true },
    { d: 'M6 36v-4h36v4' },
    { d: 'M24 32V6' },
    { d: 'M26 8l12 21H26z', relleno: true },
    { d: 'M22 11l-9 18h9z', relleno: true },
  ],
  'moto-agua': [{ d: 'M5 36h27c5 0 9-2 12-5l-1 8H9z', relleno: true }, { d: 'M15 32h11' }, { d: 'M29 31l3-7 4 1' }],
};
