/**
 * IMPUESTOS Y REGISTRO — DATO LEGAL VERIFICADO
 * --------------------------------------------
 * Fuentes: Ley 38/1992 de Impuestos Especiales (arts. 65 y 66) y consulta vinculante de la DGT
 * V1307/2025. Registro: Real Decreto 1435/2010 y transportes.gob.es.
 * Verificado: octubre de 2026.
 *
 * Son pagos ÚNICOS al comprar/matricular, no gastos anuales.
 */

import type { IdFuente } from './fuentes';

/** Impuesto Especial sobre Determinados Medios de Transporte ("impuesto de matriculación"). */
export const IEDMT = {
  esMercado: false,
  tipo: 0.12,
  /** Solo embarcaciones de uso privado de MÁS de esta eslora (m). */
  esloraMayorQue: 8,
  texto: 'Impuesto de matriculación (IEDMT): 12 % del valor, solo para embarcaciones de uso privado de más de 8 m.',
  textoExentas: 'Las de 8 m o menos están exentas, pero se declara.',
  fuentes: ['ley38', 'dgtV1307'] as IdFuente[],
};

export const IVA_NUEVA = {
  esMercado: false,
  tipo: 0.21,
  texto: 'Si la embarcación es nueva, se suma además el IVA del 21 %.',
  fuentes: ['ley38', 'dgtV1307'] as IdFuente[],
};

export const EXENCION_CHARTER = {
  esMercado: false,
  esloraMaxima: 15,
  texto: 'Exención para embarcaciones de chárter de hasta 15 m de eslora (con requisitos).',
  // TODO: los requisitos concretos no están en los datos verificados. Consultar art. 66 de la Ley 38/1992 y la consulta V1307/2025.
  requisitos: null,
  fuentes: ['ley38', 'dgtV1307'] as IdFuente[],
};

export const REGISTRO = {
  esMercado: false,
  esloraMinima: 2.5,
  texto:
    'El registro en la Dirección General de la Marina Mercante es obligatorio para toda embarcación de 2,5 m o más.',
  fuentes: ['rd1435', 'mitmaAbanderamiento'] as IdFuente[],
};

/**
 * Impuesto de transmisiones (ITP) en la compra de segunda mano entre particulares.
 * TODO: no incluido en los datos verificados. Depende de cada comunidad autónoma: consultar la
 * normativa autonómica del ITP.
 */
export const ITP_SEGUNDA_MANO: null = null;

/** Importe del IEDMT para un valor y una eslora (uso privado). 0 si está exenta por eslora. */
export function importeIEDMT(valor: number, eslora: number): number {
  return eslora > IEDMT.esloraMayorQue ? valor * IEDMT.tipo : 0;
}
