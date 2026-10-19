/**
 * MANTENIMIENTO Y COMBUSTIBLE — PRECIO ORIENTATIVO DE MERCADO (esMercado: true)
 * ----------------------------------------------------------------------------
 * Fuentes: prensa náutica (Merca2, Barcheamotore) y tarifas del varadero de Alcaidesa Marina.
 * Verificado: octubre de 2026.
 */

import type { IdFuente } from './fuentes';

export const ES_MERCADO = true;

/** Antifouling anual (dato referido al Mediterráneo). €/año. */
export const ANTIFOULING = {
  profesional: { min: 600, max: 1300 },
  /** Hecho por uno mismo: "~300 €". */
  hazloTuMismo: { min: 300, max: 300 },
  nota: 'Anual en el Mediterráneo.',
  fuentes: ['merca2', 'barcheamotore'] as IdFuente[],
};

/** Mano de obra del varadero (dato real de Alcaidesa). */
export const MANO_OBRA_VARADERO = { eurosHora: 51, fuentes: ['alcaidesaVaradero'] as IdFuente[] };

/** Varada / almacenaje en seco (dato real de Alcaidesa). */
export const VARADA = {
  eurosM2Dia: { min: 0.41, max: 0.55 },
  /** Unos 2 meses en seco. */
  dosMeses: { min: 200, max: 600 },
  fuentes: ['alcaidesaVaradero'] as IdFuente[],
};

/** Mantenimiento del motor, €/año por motor. */
export const MOTOR = {
  fueraborda: { min: 150, max: 400 },
  intraborda: { min: 300, max: 800 },
  fuentes: ['merca2', 'barcheamotore'] as IdFuente[],
};

/**
 * Regla del sector: amarre + seguro + mantenimiento suman, al año, este porcentaje del valor.
 * Solo hay dato para barco nuevo y para barcos de 5 a 15 años.
 * TODO: sin dato para barcos de 1 a 4 años ni de más de 15 años.
 */
export const REGLA_SECTOR = {
  nuevo: { min: 0.05, max: 0.08 },
  de5a15: { min: 0.1, max: 0.12 },
  fuentes: ['merca2', 'barcheamotore'] as IdFuente[],
};

/**
 * Combustible: lo configura el usuario (precio por litro y horas al año).
 * - Gasolina marina: ~1,60 €/L orientativo. TODO: verificar el precio actual en la gasolinera del puerto.
 * - Gasóleo: null. TODO: precio no incluido en los datos; consultar la gasolinera del puerto.
 * - Consumo (l/h): null. TODO: depende del motor; consultar la ficha técnica del fabricante.
 */
export const COMBUSTIBLE = {
  gasolina: { eurosLitro: 1.6 as number | null, verificar: true },
  gasoleo: { eurosLitro: null as number | null, verificar: true },
  consumoLitrosHora: null,
};

export const FUENTES_MANTENIMIENTO: IdFuente[] = ['merca2', 'barcheamotore', 'alcaidesaVaradero'];
