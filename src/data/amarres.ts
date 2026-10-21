/**
 * AMARRES — PRECIO ORIENTATIVO DE MERCADO (esMercado: true)
 * --------------------------------------------------------
 * Datos públicos 2025-2026, verificados en octubre de 2026.
 * Todas las cifras SIN IVA (21 %) salvo que se indique, y SIN tasas portuarias (T0, T5).
 *
 * Existen DOS sistemas de tarifa:
 *  - Marinas privadas: precio anual cerrado según la eslora.
 *  - Puertos públicos: cobran por m² y día (eslora × manga) o por GT, y hay que calcularlo.
 */

import type { IdFuente } from './fuentes';

export const ES_MERCADO = true;

export interface RangoAmarre {
  /** Eslora de referencia (m). */
  eslora: number;
  /** €/año sin IVA. Mínimo: zona barata atlántica/cantábrica. */
  min: number;
  /** €/año sin IVA. Máximo: Baleares/Costa Brava. */
  max: number;
}

/** Rangos para la calculadora, de la zona más barata (Atlántico/Cantábrico) a la más cara (Baleares/Costa Brava). */
export const RANGOS_AMARRE: RangoAmarre[] = [
  { eslora: 6, min: 800, max: 6000 },
  { eslora: 8, min: 1500, max: 10000 },
  { eslora: 10, min: 2500, max: 15000 },
  { eslora: 12, min: 4000, max: 25000 },
];

/** Marina seca: "~40 % más barato que en el agua". Multiplicador sobre el rango de amarre en agua. */
export const FACTOR_MARINA_SECA = 0.6;

/** Remolque en casa: ~300 €/año, solo hasta ~6 m. */
export const REMOLQUE = { eurosAnio: 300, esloraMaxima: 6 };

/**
 * Tasas portuarias (T0, T5…) que no están incluidas en los rangos.
 * TODO: importe no incluido en los datos. Consultar las tarifas del puerto concreto (su web o el BOE).
 */
export const TASAS_PORTUARIAS: null = null;

export const SISTEMAS_TARIFA = [
  {
    id: 'privada',
    nombre: 'Marina privada',
    texto: 'Dan un precio anual cerrado según la eslora del barco.',
  },
  {
    id: 'publico',
    nombre: 'Puerto público',
    texto: 'Cobran por metro cuadrado y día (eslora × manga) o por GT (arqueo bruto), así que hay que calcularlo.',
  },
] as const;

export interface EjemploAmarre {
  lugar: string;
  tipo: string;
  /** Precios por eslora, si la fuente los da así. */
  precios?: { eslora: number; euros: number; nota?: string }[];
  /** Texto literal del dato. */
  texto?: string;
  condiciones: string;
  fuente: IdFuente;
}

/**
 * Tarifa anual de Alcaidesa Marina (2026, con descuento, sin IVA). También la usa el selector de
 * puertos de la calculadora (puertos.ts).
 */
export const TARIFAS_ALCAIDESA: { eslora: number; euros: number; nota?: string }[] = [
  { eslora: 8, euros: 2568 },
  { eslora: 10, euros: 3696 },
  { eslora: 12, euros: 4314, nota: 'veleros' },
  { eslora: 12, euros: 6672, nota: 'motor' },
  { eslora: 14, euros: 5931 },
  { eslora: 15, euros: 7371 },
];

/** Datos reales verificados que se muestran como ejemplos. */
export const EJEMPLOS_AMARRE: EjemploAmarre[] = [
  {
    lugar: 'Alcaidesa Marina (Cádiz, Estrecho)',
    tipo: 'Marina privada',
    precios: TARIFAS_ALCAIDESA,
    condiciones: 'Tarifa anual con descuento, sin IVA (tarifas 2026).',
    fuente: 'alcaidesaTarifas',
  },
  {
    lugar: 'Puertos públicos del País Vasco',
    tipo: 'Puerto público (tarifa T-5 por m² y día)',
    texto:
      'Base de unos 0,17–0,30 €/m²/día. Un barco de 8 × 3 m (24 m²) paga unos 4–7 € al día: aproximadamente 1.500–2.500 € al año.',
    condiciones: 'Tarifas 2025-2026.',
    fuente: 'euskadiPuertos',
  },
  {
    lugar: 'Marina Port Ibiza',
    tipo: 'Marina privada',
    texto: 'Barco medio (8–15 m): unos 400–500 € al mes actualmente, con riesgo de triplicarse.',
    condiciones: 'Dato de prensa.',
    fuente: 'marinaPortIbiza',
  },
  {
    lugar: 'Mallorca',
    tipo: 'Puertos y marinas',
    texto: 'De 3.000 a 30.000 € al año según el puerto y el tamaño.',
    condiciones: 'Rango publicado.',
    fuente: 'mallorcaCom',
  },
  {
    lugar: 'Puertos públicos de Baleares y marinas privadas de Ibiza y Mallorca',
    tipo: 'Públicos y privados',
    texto: 'Mucho más caros que la media.',
    condiciones: 'Comparación general.',
    fuente: 'portsBalears',
  },
  {
    lugar: 'Costa Brava',
    tipo: 'Puertos premium',
    texto: 'De los más caros de España: un barco de 10 m puede superar los 2.000 € al mes en temporada alta.',
    condiciones: 'Comparativa de prensa.',
    fuente: 'araCat',
  },
];

/** Aviso obligatorio junto a cualquier cifra de amarre. */
export const AVISO_AMARRES =
  'Las tarifas las fija cada puerto y se publican en su web y en el BOE. Consulta el puerto concreto; estos rangos son orientativos y no incluyen IVA ni tasas.';

export const FUENTES_AMARRES: IdFuente[] = [
  'alcaidesaTarifas',
  'euskadiPuertos',
  'portsBalears',
  'marinaPortIbiza',
  'mallorcaCom',
  'araCat',
];

/**
 * Rango orientativo para una eslora: se usa la fila de la tabla igual o inmediatamente superior
 * (la tabla solo tiene 6, 8, 10 y 12 m). null si la eslora supera los 12 m (no hay dato).
 */
export function rangoAmarrePara(eslora: number): RangoAmarre | null {
  return RANGOS_AMARRE.find((r) => eslora <= r.eslora) ?? null;
}
