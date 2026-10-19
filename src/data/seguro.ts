/**
 * SEGURO
 * ------
 * Dos tipos de dato, separados a propósito:
 *  1. SEGURO_LEGAL   → DATO LEGAL VERIFICADO (RD 607/1999; transportes.gob.es). Se muestra como hecho.
 *  2. SEGURO_MERCADO → PRECIO ORIENTATIVO de mercado (esMercado: true). Siempre como "estimación".
 * Verificado: octubre de 2026.
 */

import type { IdFuente } from './fuentes';

export const SEGURO_LEGAL = {
  esMercado: false,
  texto:
    'El seguro de responsabilidad civil es obligatorio para toda embarcación a motor (incluidas las motos náuticas) y para toda embarcación de más de 6 m de eslora.',
  /** A partir de esta eslora (estrictamente mayor) es obligatorio aunque no tenga motor. */
  esloraObligatoriaSinMotor: 6,
  fuentes: ['rd607', 'mitmaSeguro'] as IdFuente[],
} as const;

/** ¿Es obligatorio el seguro de responsabilidad civil? (aplica la regla de SEGURO_LEGAL) */
export function seguroObligatorio(tieneMotor: boolean, eslora: number): boolean {
  return tieneMotor || eslora > SEGURO_LEGAL.esloraObligatoriaSinMotor;
}

export const SEGURO_MERCADO = {
  esMercado: true,
  /** Todo riesgo, esloras medias, €/año. */
  todoRiesgo: { min: 120, max: 600 },
  /** Aproximadamente, prima anual como fracción del valor del barco. */
  porcentajeValor: { min: 0.01, max: 0.02 },
  /**
   * Responsabilidad civil sola: las fuentes solo dicen que es "más barata" que el todo riesgo.
   * TODO: importe no indicado. Pedir precio a aseguradoras o comparadores.
   */
  soloResponsabilidadCivil: null,
  fuentes: ['roams', 'mapfre'] as IdFuente[],
} as const;
