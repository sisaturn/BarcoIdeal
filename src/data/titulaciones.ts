/**
 * TITULACIONES NÁUTICAS DE RECREO — DATO LEGAL VERIFICADO
 * -------------------------------------------------------
 * Fuente: Real Decreto 875/2014 y fichas del Ministerio de Transportes (transportes.gob.es).
 * Verificado: octubre de 2026.
 *
 * Reglas de este archivo:
 *  - Solo contiene lo que dicen los datos verificados. Lo que no está, va como null con un
 *    comentario de qué falta y dónde consultarlo. No se completa con estimaciones.
 *  - `costeCurso` NO es normativa: es un precio orientativo de mercado (esMercado: true).
 *
 * `nivel` sirve para ordenar y comparar titulaciones (0 = sin titulación … 5 = Capitán de Yate).
 */

import type { IdFuente } from './fuentes';

export type IdTitulacion = 'ninguna' | 'licencia' | 'pnb' | 'per' | 'py' | 'cy';

/** Precio orientativo de mercado (no es una tasa oficial). */
export interface PrecioMercado {
  esMercado: true;
  min: number;
  max: number;
}

export interface Titulacion {
  id: IdTitulacion;
  /** Parte final de la URL de su ficha: /titulaciones/<slug>/ (no la cambies si ya está publicada). */
  slug: string;
  nombre: string;
  corto: string;
  nivel: number;
  /** Eslora máxima a motor, en metros. null = no indicada en los datos verificados. */
  esloraMotor: number | null;
  /** Eslora máxima a vela, en metros. null = no indicada en los datos verificados. */
  esloraVela: number | null;
  /** Potencia máxima del motor en kW (solo cuando la norma la fija). */
  potenciaMaximaKw: number | null;
  /** Distancia máxima en millas. null si no hay límite o no está indicada (ver sinLimite). */
  millas: number | null;
  sinLimite: boolean;
  horario: 'diurno' | 'diurno y nocturno' | null;
  /** Atribuciones adicionales con prácticas de ampliación (PER). */
  ampliacion: { esloraMaxima: number; texto: string } | null;
  /** Atribuciones, redactadas a partir de los datos verificados. */
  atribuciones: string[];
  /** Requisitos para obtenerla. null = no indicados en los datos verificados. */
  requisitos: string | null;
  /** Precio orientativo del curso en una escuela. NO es una tasa oficial. */
  costeCurso: PrecioMercado | null;
  fuentes: IdFuente[];
}

export const TITULACIONES: Record<IdTitulacion, Titulacion> = {
  ninguna: {
    id: 'ninguna',
    slug: 'sin-titulacion',
    nombre: 'Sin titulación',
    corto: 'Sin titulación',
    nivel: 0,
    esloraMotor: 5,
    esloraVela: 6,
    potenciaMaximaKw: 11.26,
    millas: 2,
    sinLimite: false,
    horario: 'diurno',
    ampliacion: null,
    atribuciones: [
      'Embarcaciones a motor de hasta 5 m con una potencia de hasta 11,26 kW, o embarcaciones de vela de hasta 6 m.',
      'Sin alejarse más de 2 millas.',
      'Solo navegación diurna.',
    ],
    requisitos: 'No se necesita título.',
    costeCurso: null, // no aplica: no hay curso
    fuentes: ['rd875'],
  },
  licencia: {
    id: 'licencia',
    slug: 'licencia-de-navegacion',
    nombre: 'Licencia de Navegación (LN)',
    corto: 'Licencia de navegación',
    nivel: 1,
    esloraMotor: 6,
    esloraVela: 6,
    potenciaMaximaKw: null, // no indicada en los datos verificados
    millas: 2,
    sinLimite: false,
    horario: 'diurno',
    ampliacion: null,
    atribuciones: [
      'Embarcaciones de hasta 6 m.',
      'Hasta 2 millas.',
      'Solo navegación diurna.',
      'Habilita para gobernar motos náuticas.',
    ],
    // TODO: requisitos para obtenerla no incluidos en los datos verificados. Consultar la ficha de transportes.gob.es.
    requisitos: null,
    costeCurso: { esMercado: true, min: 100, max: 200 },
    fuentes: ['rd875', 'mitmaLicencia'],
  },
  pnb: {
    id: 'pnb',
    slug: 'pnb',
    nombre: 'Patrón de Navegación Básica (PNB)',
    corto: 'PNB',
    nivel: 2,
    esloraMotor: 8,
    esloraVela: 8,
    potenciaMaximaKw: null, // no indicada en los datos verificados
    millas: 5,
    sinLimite: false,
    horario: 'diurno y nocturno',
    ampliacion: null,
    atribuciones: ['Embarcaciones de hasta 8 m.', 'Hasta 5 millas.', 'Navegación diurna y nocturna.'],
    // TODO: requisitos para obtenerlo no incluidos en los datos verificados. Consultar la ficha de transportes.gob.es.
    requisitos: null,
    costeCurso: { esMercado: true, min: 300, max: 500 },
    fuentes: ['rd875', 'mitmaPnb'],
  },
  per: {
    id: 'per',
    slug: 'per',
    nombre: 'Patrón de Embarcaciones de Recreo (PER)',
    corto: 'PER',
    nivel: 3,
    esloraMotor: 15,
    esloraVela: 15,
    potenciaMaximaKw: null, // no indicada en los datos verificados
    millas: 12,
    sinLimite: false,
    // TODO: horario no indicado en los datos verificados. Consultar RD 875/2014.
    horario: null,
    ampliacion: {
      esloraMaxima: 24,
      texto: 'Con prácticas de ampliación: hasta 24 m y navegación entre la península y Baleares.',
    },
    atribuciones: [
      'Básico: embarcaciones de hasta 15 m y hasta 12 millas.',
      'Con prácticas de ampliación: hasta 24 m y navegación entre la península y Baleares.',
      'Incluye la licencia de radio.',
    ],
    // TODO: requisitos para obtenerlo no incluidos en los datos verificados. Consultar la ficha de transportes.gob.es.
    requisitos: null,
    costeCurso: { esMercado: true, min: 400, max: 700 },
    fuentes: ['rd875', 'mitmaPer'],
  },
  py: {
    id: 'py',
    slug: 'patron-de-yate',
    nombre: 'Patrón de Yate (PY)',
    corto: 'Patrón de Yate',
    nivel: 4,
    esloraMotor: 24,
    esloraVela: 24,
    potenciaMaximaKw: null, // no indicada en los datos verificados
    millas: 150,
    sinLimite: false,
    // TODO: horario no indicado en los datos verificados. Consultar RD 875/2014.
    horario: null,
    ampliacion: null,
    atribuciones: ['Embarcaciones de hasta 24 m.', 'Hasta 150 millas.'],
    requisitos: 'Tener el PER, aprobar el examen y hacer 48 horas de prácticas.',
    costeCurso: { esMercado: true, min: 800, max: 1500 },
    fuentes: ['rd875', 'mitmaPy'],
  },
  cy: {
    id: 'cy',
    slug: 'capitan-de-yate',
    nombre: 'Capitán de Yate (CY)',
    corto: 'Capitán de Yate',
    nivel: 5,
    // TODO: eslora máxima no incluida en los datos verificados. Consultar RD 875/2014 (art. 8) o la ficha de transportes.gob.es.
    esloraMotor: null,
    esloraVela: null,
    potenciaMaximaKw: null, // no indicada en los datos verificados
    millas: null,
    sinLimite: true,
    // TODO: horario no indicado en los datos verificados. Consultar RD 875/2014.
    horario: null,
    ampliacion: null,
    atribuciones: ['Sin límite.'],
    requisitos: 'Tener el título de Patrón de Yate.',
    // TODO: coste orientativo del curso no incluido en los datos. Pedir precio a escuelas náuticas.
    costeCurso: null,
    fuentes: ['rd875', 'mitmaCy'],
  },
};

/** Lista ordenada de menor a mayor nivel. */
export const LISTA_TITULACIONES: Titulacion[] = Object.values(TITULACIONES).sort((a, b) => a.nivel - b.nivel);

/** Eslora máxima según la propulsión del barco. null = no indicada. */
export function esloraMaximaPara(t: Titulacion, propulsion: 'motor' | 'vela'): number | null {
  return propulsion === 'vela' ? t.esloraVela : t.esloraMotor;
}

/** Texto corto del alcance ("Hasta 5 millas · de día y de noche"). Solo con datos verificados. */
export function alcanceTitulacion(t: Titulacion): string {
  const partes: string[] = [];
  if (t.sinLimite) partes.push('Sin límite');
  else if (t.millas !== null) partes.push(`Hasta ${t.millas} millas`);
  if (t.horario === 'diurno') partes.push('solo de día');
  if (t.horario === 'diurno y nocturno') partes.push('de día y de noche');
  return partes.join(' · ');
}

/** Valida un id de titulación que llega de fuera (URL, navegador). */
export const esTitulacion = (v: unknown): v is IdTitulacion => typeof v === 'string' && Object.hasOwn(TITULACIONES, v);

/** Aviso que acompaña a los datos de titulaciones. */
export const AVISO_TITULACIONES =
  'Datos de la normativa (Real Decreto 875/2014) verificados en octubre de 2026. Los precios de los cursos son orientativos de mercado, no tasas oficiales. Ante cualquier duda, prevalece la fuente oficial.';
