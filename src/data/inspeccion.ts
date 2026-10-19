/**
 * INSPECCIÓN (ITB / RECONOCIMIENTOS) — DATO LEGAL VERIFICADO
 * ---------------------------------------------------------
 * Fuente: Real Decreto 1434/1999 y tabla oficial de periodicidad de transportes.gob.es.
 * Verificado: octubre de 2026.
 *
 * El PRECIO de la inspección no es un dato público único: cada entidad colaboradora fija el suyo.
 */

import type { IdFuente } from './fuentes';

export type Lista = 6 | 7;

export interface ReglaPeriodicidad {
  lista: Lista;
  /** Eslora mínima incluida (m). */
  esloraDesde: number;
  /** Eslora máxima (m). `hastaExclusivo`: true si el límite superior no se incluye ("< 6 m"). */
  esloraHasta: number;
  hastaExclusivo: boolean;
  /** Años máximos entre reconocimientos periódicos. null = sin caducidad. */
  anios: number | null;
  texto: string;
}

export const PERIODICIDAD: ReglaPeriodicidad[] = [
  { lista: 7, esloraDesde: 0, esloraHasta: 6, hastaExclusivo: true, anios: null, texto: 'Sin caducidad' },
  { lista: 7, esloraDesde: 6, esloraHasta: 24, hastaExclusivo: false, anios: 5, texto: 'Cada 5 años como máximo' },
  { lista: 6, esloraDesde: 2.5, esloraHasta: 24, hastaExclusivo: false, anios: 5, texto: 'Cada 5 años como máximo' },
];

/** Reconocimiento intermedio: entre el 2.º y el 3.er año. */
export const INTERMEDIA = {
  esloraMinima: 15,
  esloraMinimaCascoMadera: 6,
  texto:
    'Reconocimiento intermedio entre el 2.º y el 3.er año para esloras de 15 m o más (o de 6 m o más con casco de madera).',
};

export const MARCADO_CE = {
  esloraMaxima: 12,
  texto: 'Las embarcaciones con marcado CE de hasta 12 m están exentas del reconocimiento inicial.',
};

/** Entidades colaboradoras de inspección citadas en la fuente. */
export const ENTIDADES_COLABORADORAS = ['Applus', 'APAVE', 'LABCER', 'OCA ICP', 'SGS', 'Aldamar'];

/**
 * Precio de la inspección.
 * null: cada entidad lo fija. Pedir presupuesto a una entidad colaboradora de la zona.
 */
export const PRECIO_INSPECCION: null = null;

export const FUENTES_INSPECCION: IdFuente[] = ['rd1434', 'mitmaInspeccion'];

/** Regla de periodicidad aplicable. null si la combinación lista/eslora no está en la tabla. */
export function periodicidadPara(lista: Lista, eslora: number): ReglaPeriodicidad | null {
  return (
    PERIODICIDAD.find(
      (r) =>
        r.lista === lista &&
        eslora >= r.esloraDesde &&
        (r.hastaExclusivo ? eslora < r.esloraHasta : eslora <= r.esloraHasta),
    ) ?? null
  );
}

export function necesitaIntermedia(eslora: number, cascoMadera: boolean): boolean {
  return eslora >= INTERMEDIA.esloraMinima || (cascoMadera && eslora >= INTERMEDIA.esloraMinimaCascoMadera);
}
