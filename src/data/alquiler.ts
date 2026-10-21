/**
 * ALQUILER — datos del comparador "¿Comprar o alquilar?"
 * -----------------------------------------------------
 * No hay datos verificados de precios de alquiler ni de amortización. Por eso todos los valores
 * son null y el comparador pide al usuario que escriba los suyos.
 *
 * TODO: precio por día de alquiler (con y sin patrón) por tipo de barco y zona.
 *       Fuente sugerida: tarifas publicadas por empresas de chárter de cada zona.
 * TODO: amortización anual (pérdida de valor) por tipo y antigüedad.
 *       Fuente sugerida: tasadores náuticos o comparativa de precios de segunda mano.
 */

import type { IdTipoBarco } from './tiposBarco';

export interface PrecioAlquiler {
  /** € por día sin patrón. null = sin dato verificado. */
  sinPatron: number | null;
  /** € por día con patrón. null = sin dato verificado. */
  conPatron: number | null;
}

export const ALQUILER_DIA: Record<IdTipoBarco, PrecioAlquiler> = {
  semirrigida: { sinPatron: null, conPatron: null },
  'lancha-open': { sinPatron: null, conPatron: null },
  'lancha-cabina': { sinPatron: null, conPatron: null },
  'velero-pequeno': { sinPatron: null, conPatron: null },
  'velero-crucero': { sinPatron: null, conPatron: null },
  catamaran: { sinPatron: null, conPatron: null },
  'yate-lujo': { sinPatron: null, conPatron: null },
  superyate: { sinPatron: null, conPatron: null },
  'moto-agua': { sinPatron: null, conPatron: null },
};

/** Pérdida de valor anual (fracción del valor). null = sin dato verificado. */
export const AMORTIZACION_ANUAL: number | null = null;

/** Matices que se muestran bajo el comparador (no son cifras). */
export const MATICES_ALQUILER = [
  'Tener barco te da libertad total: sales cuando quieres, sin reservar.',
  'Alquilar te permite cambiar de barco y de zona, y no te ocupas del mantenimiento.',
  'Los precios de alquiler cambian mucho según la temporada: pide precio para tus fechas.',
];
