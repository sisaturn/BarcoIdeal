/**
 * MANTENIMIENTO Y COMBUSTIBLE — PRECIO ORIENTATIVO DE MERCADO (esMercado: true)
 * ----------------------------------------------------------------------------
 * Fuentes: prensa y blogs náuticos (Merca2, Barcheamotore, Todobarco, Seatravel, Emotions by Lu,
 * Buscamos tu barco), fabricantes (Mercury, Yanmar) y tarifas del varadero de Alcaidesa Marina.
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

/**
 * MANTENIMIENTO DEL MOTOR
 * Fórmula: revisión anual (según el tipo de motor) × revisiones al año según las horas × número de motores.
 *  - Revisión anual: cifras de blogs náuticos (enlazados en fuentes.ts), comprobadas el 21-10-2026.
 *    `abierto: true` = la fuente solo da un mínimo («puede superar…»): se muestra «X € o más».
 *  - Revisiones al año = horas de uso ÷ intervalo del fabricante, como mínimo 1.
 *    SUPOSICIÓN (no viene de las fuentes): cada revisión extra cuesta lo mismo que la anual.
 *  - No hay fuentes que relacionen el coste con el consumo o la potencia: no se usan.
 */
export type TipoRevision =
  'fueraborda-pequeno' | 'fueraborda-grande' | 'intraborda-hasta10' | 'intraborda-mediano' | 'intraborda-grande';

export interface RevisionMotor {
  /** € por revisión y motor (salvo `incluyeTodosLosMotores`). */
  min: number;
  max: number;
  abierto: boolean;
  /** Dato tal como lo da la fuente, para la explicación. */
  texto: string;
  /** La cifra ya cubre todos los motores (y el generador): no se multiplica por el número de motores. */
  incluyeTodosLosMotores?: boolean;
  fuentes: IdFuente[];
}

export const REVISION_MOTOR: Record<TipoRevision, RevisionMotor> = {
  'fueraborda-pequeno': {
    min: 300,
    max: 300,
    abierto: false,
    texto: 'Fueraborda pequeño: unos 300 € al año',
    fuentes: ['buscamostubarco'],
  },
  'fueraborda-grande': {
    min: 1000,
    max: 1000,
    abierto: true,
    texto: 'Fueraborda grande: puede superar los 1.000 € al año',
    fuentes: ['buscamostubarco'],
  },
  'intraborda-hasta10': {
    min: 200,
    max: 800,
    abierto: false,
    texto: 'Revisión anual del motor en embarcaciones de hasta 10 m: 200–800 €',
    fuentes: ['todobarco'],
  },
  'intraborda-mediano': {
    min: 800,
    max: 2000,
    abierto: false,
    texto: 'Intraborda en barcos medianos: 800–2.000 € al año',
    fuentes: ['emotionsbylu'],
  },
  'intraborda-grande': {
    min: 3000,
    max: 3000,
    abierto: true,
    texto: 'Barcos grandes con dos motores y generador: puede superar los 3.000 € al año',
    incluyeTodosLosMotores: true,
    fuentes: ['emotionsbylu'],
  },
};

/** Eslora hasta la que se usa el dato de Todobarco para un intraborda (la fuente habla de «hasta 10 metros»). */
export const ESLORA_INTRABORDA_PEQUENO = 10;

/** Referencia general (no entra en la fórmula; se cita en la explicación): 500–2.000 €/año según tipo y estado. */
export const MOTOR_GENERAL = { min: 500, max: 2000, fuentes: ['seatravel'] as IdFuente[] };

/**
 * Intervalo entre revisiones según el fabricante (horas de uso o una vez al año, lo que llegue antes).
 * TODO: intraborda de gasolina sin dato de intervalo; consultar el manual del motor. Se cuenta 1 revisión al año.
 */
export const INTERVALO_REVISION = {
  fueraborda: { horas: 100, fuentes: ['mercuryMantenimiento'] as IdFuente[] },
  intrabordaDiesel: { horas: 250, fuentes: ['yanmarMantenimiento'] as IdFuente[] },
  intrabordaGasolina: null,
};

export const FUENTES_MOTOR: IdFuente[] = [
  'buscamostubarco',
  'todobarco',
  'emotionsbylu',
  'seatravel',
  'mercuryMantenimiento',
  'yanmarMantenimiento',
];

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
