/**
 * RECOMENDADOR DE TIPO DE BARCO
 * =============================
 * Sistema de puntuación por reglas, sin IA ni servicios externos. Funciona así:
 *
 *  1. Cada tipo de barco empieza con 0 puntos.
 *  2. Por cada respuesta del test se aplican las REGLAS de la tabla de abajo:
 *     suman o restan puntos a cada tipo.
 *  3. Se aplican tres reglas especiales que dependen de los datos de cada tipo:
 *       - Titulación: si el barco exige más titulación de la que tienes o quieres
 *         sacarte, queda descartado.
 *       - Presupuesto de compra: compara con el precio orientativo de segunda mano.
 *       - Presupuesto anual: compara con el coste anual que calcula la calculadora.
 *  4. Se ordenan por puntos y se muestran los 2 o 3 primeros.
 *
 * Cómo ajustarlo:
 *  - Para que un tipo salga más (o menos) con una respuesta, cambia sus puntos en REGLAS.
 *  - Los textos `aFavor` / `enContra` son los que ve el usuario en el resultado.
 *  - Las constantes de la sección "Parámetros" controlan las reglas especiales.
 *
 * Escala orientativa de puntos:
 *   +4 encaja muy bien · +2 encaja · +1 algo a favor · 0 neutro
 *   -2 algo en contra · -4 encaja mal · -8 o menos: prácticamente incompatible
 */

import { TIPOS_BARCO, LISTA_TIPOS_BARCO, type IdTipoBarco, type TipoBarco } from './tiposBarco';
import { TITULACIONES, esTitulacion, esloraMaximaPara, type IdTitulacion } from './titulaciones';
import { PREGUNTAS, type IdPregunta, type Respuestas } from './preguntas';
import type { IdAmarre, IdZona } from './costes';
import { costeAnual, entradasPorDefecto, textoRango, type EntradasCalculo, type Rango } from '../lib/calculoCostes';
import { euros, num } from '../lib/formato';

type Puntos = Partial<Record<IdTipoBarco, number>>;

interface Regla {
  /** Pregunta y respuesta que activan la regla. */
  pregunta: IdPregunta;
  respuesta: string;
  /** Puntos para cada tipo. Los tipos que no aparecen reciben 0. */
  puntos: Puntos;
  /** Se muestra en "Por qué encaja" a los tipos que SUMAN puntos con esta regla. */
  aFavor?: string;
  /** Se muestra en "Ten en cuenta" a los tipos que RESTAN puntos con esta regla. */
  enContra?: string;
}

// ===========================================================================
// PARÁMETROS
// ===========================================================================

/** Puntos de la regla de titulación (el descarte por titulación insuficiente es automático). */
const PUNTOS_TITULACION = {
  /** Tu titulación cubre el tamaño habitual de este tipo. */
  cubreLoHabitual: 1,
  /** Solo te permite las unidades más pequeñas de este tipo. */
  soloPequenos: -2,
};

/** Rangos de la pregunta "compra", en euros. */
const RANGOS_COMPRA: Record<string, [number, number]> = {
  '<10': [0, 10_000],
  '10-30': [10_000, 30_000],
  '30-60': [30_000, 60_000],
  '60-120': [60_000, 120_000],
  '120-300': [120_000, 300_000],
  '300-1000': [300_000, 1_000_000],
  '1000-3000': [1_000_000, 3_000_000],
  '3000+': [3_000_000, Infinity],
};

const PUNTOS_COMPRA = {
  /** Hay unidades de segunda mano dentro del presupuesto. */
  dentro: 2,
  /** Incluso las más baratas superan el presupuesto. */
  fuera: -8,
};

/** Rangos de la pregunta "anual", en euros al año. */
const RANGOS_ANUAL: Record<string, [number, number]> = {
  '<1.5': [0, 1_500],
  '1.5-4': [1_500, 4_000],
  '4-8': [4_000, 8_000],
  '8-15': [8_000, 15_000],
  '15-40': [15_000, 40_000],
  '40-100': [40_000, 100_000],
  '100+': [100_000, Infinity],
};

const PUNTOS_ANUAL = {
  /** El coste anual estimado cabe en lo que quiere gastar. */
  dentro: 2,
  /** Lo supera, pero menos de un 30 %. */
  algoPorEncima: -1,
  /** Lo supera en más de un 30 %. */
  muyPorEncima: -4,
  /** Margen para considerar "algo por encima" (1,3 = 30 % más). */
  margen: 1.3,
};

/**
 * Etiqueta de encaje según los puntos totales (de mayor a menor umbral).
 * Se muestra en cada tarjeta del resultado.
 */
export const NIVELES_ENCAJE: { desde: number; texto: string; tono: 'alto' | 'medio' | 'bajo' }[] = [
  { desde: 12, texto: 'Encaja muy bien contigo', tono: 'alto' },
  { desde: 5, texto: 'Encaja bien contigo', tono: 'alto' },
  { desde: 1, texto: 'Encaja con matices', tono: 'medio' },
  { desde: -Infinity, texto: 'Alternativa con pegas', tono: 'bajo' },
];

/** Cuántos motivos "Por qué encaja" se muestran en cada tarjeta (el resto, en el desglose). */
export const MAX_MOTIVOS_A_FAVOR = 5;

/** Cuántos tipos se muestran como máximo y cuándo se omite el tercero. */
const SELECCION = {
  maximo: 3,
  minimo: 2,
  /** El tercero solo se muestra si tiene más de 0 puntos y no está a más de esta distancia del primero. */
  distanciaMaximaTercero: 8,
};

// ===========================================================================
// TABLA DE REGLAS
// ===========================================================================

export const REGLAS: Regla[] = [
  // --- Uso principal -------------------------------------------------------
  {
    pregunta: 'uso',
    respuesta: 'paseo',
    puntos: {
      'yate-lujo': 2,
      superyate: 1,
      semirrigida: 3,
      'lancha-open': 3,
      'lancha-cabina': 2,
      catamaran: 2,
      'velero-pequeno': 1,
      'velero-crucero': 1,
      'moto-agua': -3,
    },
    aFavor: 'Para paseo y baño es cómodo: fácil subir del agua y sitio para tumbarse.',
    enContra: 'Para pasar el día en una cala, bañarse y comer a bordo se queda muy corta.',
  },
  {
    pregunta: 'uso',
    respuesta: 'pesca',
    puntos: {
      'yate-lujo': -2,
      superyate: -4,
      'lancha-open': 4,
      semirrigida: 3,
      'lancha-cabina': 3,
      catamaran: -1,
      'velero-pequeno': -2,
      'velero-crucero': -2,
      'moto-agua': -6,
    },
    aFavor: 'Para pescar viene bien su cubierta despejada y fácil de baldear.',
    enContra: 'Para pescar no es lo más práctico: poco espacio libre y cabos o aparejos por medio.',
  },
  {
    pregunta: 'uso',
    respuesta: 'vela',
    puntos: {
      'yate-lujo': -5,
      superyate: -5,
      'velero-pequeno': 4,
      'velero-crucero': 4,
      catamaran: 3,
      semirrigida: -4,
      'lancha-open': -4,
      'lancha-cabina': -4,
      'moto-agua': -5,
    },
    aFavor: 'Está pensado para navegar a vela, que es lo que te atrae.',
    enContra: 'Si lo que te gusta es la vela, un barco a motor te dejará con las ganas.',
  },
  {
    pregunta: 'uso',
    respuesta: 'deportes',
    puntos: {
      'yate-lujo': 1,
      'moto-agua': 4,
      semirrigida: 3,
      'lancha-open': 3,
      'lancha-cabina': 1,
      'velero-pequeno': -3,
      catamaran: -3,
      'velero-crucero': -4,
    },
    aFavor: 'Tiene la potencia y la popa despejada que piden el esquí, el wake o los hinchables.',
    enContra: 'No está pensado para remolcar esquí, wakeboard o hinchables.',
  },
  {
    pregunta: 'uso',
    respuesta: 'travesias',
    puntos: {
      'yate-lujo': 3,
      superyate: 4,
      'velero-crucero': 4,
      catamaran: 3,
      'lancha-cabina': 3,
      semirrigida: -1,
      'velero-pequeno': -1,
      'moto-agua': -4,
    },
    aFavor: 'Para travesías tiene autonomía, aguanta bien la mar y puedes dormir a bordo.',
    enContra: 'Para travesías se queda corto en autonomía, comodidad o seguridad con mal tiempo.',
  },
  {
    pregunta: 'uso',
    respuesta: 'vivir',
    puntos: {
      'yate-lujo': 3,
      superyate: 4,
      catamaran: 5,
      'velero-crucero': 4,
      'lancha-cabina': 2,
      'lancha-open': -3,
      'velero-pequeno': -3,
      semirrigida: -4,
      'moto-agua': -6,
    },
    aFavor: 'Tiene espacio interior, cocina y baño para pasar temporadas a bordo.',
    enContra: 'No tiene espacio habitable para pasar temporadas a bordo.',
  },

  // --- Zona de navegación --------------------------------------------------
  {
    pregunta: 'zona',
    respuesta: 'med',
    puntos: { 'lancha-open': 1, semirrigida: 1, 'moto-agua': 1 },
    aFavor: 'En el Mediterráneo, con mar bastante tranquila en verano, se disfruta mucho un barco abierto.',
  },
  {
    pregunta: 'zona',
    respuesta: 'atl',
    puntos: {
      'yate-lujo': 1,
      superyate: 1,
      'velero-crucero': 2,
      'lancha-cabina': 2,
      semirrigida: 1,
      'lancha-open': -1,
      'velero-pequeno': -1,
      'moto-agua': -2,
    },
    aFavor: 'En el Atlántico y el Cantábrico, con más mar y viento, se agradece un barco marinero.',
    enContra: 'En el Atlántico y el Cantábrico hay más mar y viento: te limitará a los días buenos.',
  },
  {
    pregunta: 'zona',
    respuesta: 'can',
    puntos: {
      'yate-lujo': 1,
      superyate: 1,
      'velero-crucero': 2,
      catamaran: 2,
      semirrigida: 1,
      'lancha-cabina': 1,
      'lancha-open': -1,
      'velero-pequeno': -1,
    },
    aFavor: 'En Canarias se navega todo el año, pero el alisio y el mar de fondo piden un barco marinero.',
    enContra: 'En Canarias el alisio y el mar de fondo pueden limitar bastante este tipo de barco.',
  },
  {
    pregunta: 'zona',
    respuesta: 'bal',
    puntos: {
      'yate-lujo': 2,
      superyate: 2,
      catamaran: 2,
      'velero-crucero': 2,
      'lancha-cabina': 2,
      'lancha-open': 1,
      semirrigida: 1,
    },
    aFavor: 'En Baleares hay calas de sobra para fondear y pasar el día (o la noche) a bordo.',
  },
  {
    pregunta: 'zona',
    respuesta: 'int',
    puntos: {
      'yate-lujo': -10,
      superyate: -10,
      'velero-pequeno': 3,
      semirrigida: 2,
      'lancha-open': 2,
      'moto-agua': 1,
      'lancha-cabina': -2,
      'velero-crucero': -8,
      catamaran: -10,
    },
    aFavor: 'En embalses y ríos lo práctico es un barco ligero, de poco calado y fácil de botar.',
    enContra: 'En embalses y ríos no es práctico por tamaño, calado o falta de amarres.',
  },

  // --- Número de personas --------------------------------------------------
  {
    pregunta: 'personas',
    respuesta: '1-2',
    puntos: {
      'yate-lujo': -4,
      superyate: -6,
      'moto-agua': 3,
      'velero-pequeno': 2,
      semirrigida: 2,
      'lancha-open': 1,
      catamaran: -2,
    },
    aFavor: 'Para una o dos personas no necesitas más: menos gasto y más fácil de manejar.',
    enContra: 'Para una o dos personas es mucho barco: pagarás espacio que no usas.',
  },
  {
    pregunta: 'personas',
    respuesta: '3-4',
    puntos: {
      'yate-lujo': -1,
      superyate: -4,
      semirrigida: 2,
      'lancha-open': 2,
      'lancha-cabina': 2,
      'velero-crucero': 2,
      'velero-pequeno': 1,
      'moto-agua': -5,
    },
    aFavor: 'Tiene sitio cómodo para 3 o 4 personas.',
    enContra: 'Se queda pequeño para 3 o 4 personas.',
  },
  {
    pregunta: 'personas',
    respuesta: '5-6',
    puntos: {
      'yate-lujo': 2,
      'lancha-open': 2,
      'lancha-cabina': 2,
      'velero-crucero': 2,
      catamaran: 2,
      'velero-pequeno': -2,
      'moto-agua': -6,
    },
    aFavor: 'Caben 5 o 6 personas sin ir apretados.',
    enContra: 'Con 5 o 6 personas iríais muy justos.',
  },
  {
    pregunta: 'personas',
    respuesta: '7+',
    puntos: {
      'yate-lujo': 3,
      superyate: 4,
      catamaran: 3,
      'lancha-cabina': 2,
      'velero-crucero': 1,
      'lancha-open': 1,
      semirrigida: -2,
      'velero-pequeno': -4,
      'moto-agua': -8,
    },
    aFavor: 'Para grupos grandes hace falta la manga y la cubierta amplia que tiene.',
    enContra: 'No admite grupos grandes con comodidad (y a menudo tampoco legalmente).',
  },

  // --- Días de uso al año --------------------------------------------------
  {
    pregunta: 'dias',
    respuesta: '<15',
    puntos: {
      'yate-lujo': -4,
      superyate: -5,
      semirrigida: 1,
      'lancha-open': 1,
      'moto-agua': 1,
      'velero-pequeno': 1,
      'lancha-cabina': -1,
      'velero-crucero': -2,
      catamaran: -3,
    },
    aFavor: 'Para pocos días al año compensa un barco sencillo con gastos fijos bajos.',
    enContra: 'Para tan pocos días al año, cada salida te saldría muy cara.',
  },
  {
    pregunta: 'dias',
    respuesta: '15-40',
    puntos: { semirrigida: 1, 'lancha-open': 1, 'lancha-cabina': 1, 'velero-pequeno': 1 },
    aFavor: 'Encaja con un uso de fines de semana y vacaciones.',
  },
  {
    pregunta: 'dias',
    respuesta: '40-80',
    puntos: {
      'yate-lujo': 1,
      superyate: 1,
      'lancha-cabina': 1,
      'velero-crucero': 1,
      catamaran: 1,
      'velero-pequeno': 1,
    },
    aFavor: 'Con un uso frecuente se aprovecha mejor un barco más completo.',
  },
  {
    pregunta: 'dias',
    respuesta: '80+',
    puntos: {
      'yate-lujo': 1,
      superyate: 2,
      'velero-crucero': 2,
      catamaran: 2,
      'lancha-cabina': 1,
      'velero-pequeno': 1,
      'moto-agua': -1,
    },
    aFavor: 'Con tanto uso compensan la comodidad y un barco que aguante mucho trote.',
  },

  // --- Dónde se guarda ------------------------------------------------------
  {
    pregunta: 'guardado',
    respuesta: 'puerto',
    puntos: { 'yate-lujo': 2, superyate: 3, 'velero-crucero': 2, catamaran: 2, 'lancha-cabina': 1, 'moto-agua': -1 },
    aFavor: 'Con amarre en puerto puedes tener un barco más grande y siempre listo para salir.',
    enContra: 'Tenerla en un amarre de puerto no suele compensar.',
  },
  {
    pregunta: 'guardado',
    respuesta: 'seca',
    puntos: {
      'yate-lujo': -10,
      superyate: -10,
      'lancha-open': 2,
      semirrigida: 2,
      'moto-agua': 2,
      'lancha-cabina': 1,
      'velero-crucero': -5,
      catamaran: -8,
    },
    aFavor: 'Cabe en marina seca: sin antifouling y con el casco protegido.',
    enContra: 'Por tamaño o peso no suele caber en una marina seca.',
  },
  {
    pregunta: 'guardado',
    respuesta: 'remolque',
    puntos: {
      'yate-lujo': -10,
      superyate: -10,
      semirrigida: 3,
      'moto-agua': 3,
      'velero-pequeno': 2,
      'lancha-open': 1,
      'lancha-cabina': -3,
      'velero-crucero': -8,
      catamaran: -10,
    },
    aFavor: 'Se remolca con facilidad y se guarda en casa: te ahorras el amarre.',
    enContra: 'Es demasiado grande o pesado para llevarlo en un remolque con un coche normal.',
  },
  // 'nose' (aún no lo sé) no suma ni resta.

  // --- Experiencia ----------------------------------------------------------
  {
    pregunta: 'experiencia',
    respuesta: 'ninguna',
    puntos: {
      'yate-lujo': -3,
      superyate: -2,
      semirrigida: 2,
      'lancha-open': 2,
      'moto-agua': 1,
      'velero-pequeno': 1,
      'velero-crucero': -2,
      catamaran: -2,
    },
    aFavor: 'Es sencillo de manejar: ideal para empezar.',
    enContra: 'Sin experiencia puede resultar exigente; plantéate un curso o unas salidas con patrón.',
  },
  {
    pregunta: 'experiencia',
    respuesta: 'alguna',
    puntos: { semirrigida: 1, 'lancha-open': 1, 'lancha-cabina': 1, 'velero-pequeno': 1 },
    aFavor: 'Con algo de experiencia lo manejarás con soltura en poco tiempo.',
  },
  {
    pregunta: 'experiencia',
    respuesta: 'media',
    puntos: { 'yate-lujo': 1, 'lancha-cabina': 1, 'velero-crucero': 1 },
    aFavor: 'Con la experiencia que tienes puedes dar el salto a un barco más completo.',
  },
  {
    pregunta: 'experiencia',
    respuesta: 'mucha',
    puntos: { 'yate-lujo': 1, superyate: 1, 'velero-crucero': 1, catamaran: 1, 'lancha-cabina': 1 },
    aFavor: 'Con tu experiencia le sacarás todo el partido.',
  },

  // --- Motor o vela ---------------------------------------------------------
  {
    pregunta: 'propulsion',
    respuesta: 'motor',
    puntos: {
      'yate-lujo': 3,
      superyate: 3,
      semirrigida: 3,
      'lancha-open': 3,
      'lancha-cabina': 3,
      'moto-agua': 3,
      catamaran: -3,
      'velero-pequeno': -8,
      'velero-crucero': -8,
    },
    aFavor: 'Es a motor, como prefieres.',
    enContra: 'Es un barco de vela y tú prefieres motor (aunque también los hay a motor, en el caso del catamarán).',
  },
  {
    pregunta: 'propulsion',
    respuesta: 'vela',
    puntos: {
      'yate-lujo': -8,
      superyate: -8,
      'velero-pequeno': 3,
      'velero-crucero': 3,
      catamaran: 3,
      semirrigida: -8,
      'lancha-open': -8,
      'lancha-cabina': -8,
      'moto-agua': -8,
    },
    aFavor: 'Es de vela, como prefieres.',
    enContra: 'Es a motor y tú prefieres vela.',
  },
  // 'igual' (me da igual) no suma ni resta.
];

/**
 * Notas generales que se muestran en el resultado según algunas respuestas,
 * independientemente del barco recomendado.
 */
export const NOTAS: { pregunta: IdPregunta; respuesta: string; texto: string }[] = [
  {
    pregunta: 'dias',
    respuesta: '<15',
    texto:
      'Con menos de 15 días al año, compara bien con el alquiler antes de comprar: en la calculadora puedes hacer la cuenta con los precios de tu zona.',
  },
  {
    pregunta: 'zona',
    respuesta: 'bal',
    // Dato legal verificado (RD 875/2014): el PER con prácticas de ampliación permite navegar entre la península y Baleares.
    texto: 'Para navegar entre la península y Baleares hace falta, como mínimo, el PER con prácticas de ampliación.',
  },
  {
    pregunta: 'experiencia',
    respuesta: 'ninguna',
    texto:
      'Antes de comprar, sal unas cuantas veces en barcos de alquiler o de amigos: es la mejor forma de confirmar qué te gusta.',
  },
  // Sin precios de compra verificados el presupuesto no puntúa; en los tramos más altos solo se señalan
  // las fichas de los yates grandes para que el usuario las compare.
  {
    pregunta: 'compra',
    respuesta: '1000-3000',
    texto:
      'Con un presupuesto de 1 a 3 millones, mira también las fichas de «Yate de lujo» y «Superyate» en Tipos de barco. Aún no tenemos precios de compra verificados, así que el presupuesto no cambia la puntuación.',
  },
  {
    pregunta: 'compra',
    respuesta: '3000+',
    texto:
      'Con un presupuesto de más de 3 millones, mira también las fichas de «Yate de lujo» y «Superyate» en Tipos de barco. Aún no tenemos precios de compra verificados, así que el presupuesto no cambia la puntuación.',
  },
];

// ===========================================================================
// MOTOR DEL RECOMENDADOR (normalmente no hace falta tocar nada de aquí abajo)
// ===========================================================================

export interface LineaPuntuacion {
  /** De dónde vienen los puntos, p. ej. "Uso: Pesca". */
  origen: string;
  puntos: number;
}

export interface Recomendacion {
  tipo: TipoBarco;
  puntos: number;
  /** Motivos a favor y en contra, ordenados de más a menos peso. */
  aFavor: string[];
  enContra: string[];
  /** Desglose de puntos para la sección "Cómo se ha calculado". */
  detalle: LineaPuntuacion[];
  /** Si está descartado, el motivo. */
  descartado?: string;
  /** Eslora orientativa ajustada a la titulación del usuario. */
  eslora: { min: number; max: number; tipica: number };
  /**
   * Rango del coste anual que SÍ podemos estimar con datos verificados (amarre y mantenimiento básico).
   * Es parcial: no incluye seguro, combustible, inspección ni tasas. null si no hay nada estimable.
   */
  costeAnualEstimado: Rango | null;
  /** Partidas incluidas en ese rango. */
  costeIncluye: string[];
  /** Entradas con las que abrir la calculadora prerrellenada. */
  entradasCalculadora: EntradasCalculo;
}

const etiquetaOrigen = (id: IdPregunta, valor: string) => {
  const p = PREGUNTAS.find((x) => x.id === id);
  const o = p?.opciones.find((x) => x.valor === valor);
  return `${p?.corto ?? id}: ${o?.etiqueta ?? valor}`;
};

/** Eslora orientativa del tipo, recortada por la eslora máxima que permite la titulación. */
function esloraParaTi(tipo: TipoBarco, titulo: IdTitulacion | undefined) {
  const maxTitulo = titulo ? esloraMaximaPara(TITULACIONES[titulo], tipo.propulsion) : null;
  const max = maxTitulo === null ? tipo.eslora.max : Math.max(tipo.eslora.min, Math.min(tipo.eslora.max, maxTitulo));
  return { min: tipo.eslora.min, max, tipica: Math.min(tipo.eslora.tipica, max) };
}

/** Puntúa un tipo de barco con todas las reglas. */
function puntuar(tipo: TipoBarco, r: Respuestas): Recomendacion {
  let puntos = 0;
  const aFavor: { texto: string; puntos: number }[] = [];
  const enContra: { texto: string; puntos: number }[] = [];
  const detalle: LineaPuntuacion[] = [];
  let descartado: string | undefined;

  const anotar = (origen: string, p: number, favor?: string, contra?: string) => {
    if (p === 0) return;
    puntos += p;
    detalle.push({ origen, puntos: p });
    if (p > 0 && favor) aFavor.push({ texto: favor, puntos: p });
    if (p < 0 && contra) enContra.push({ texto: contra, puntos: p });
  };

  // 1) Tabla de reglas
  for (const regla of REGLAS) {
    if (r[regla.pregunta] !== regla.respuesta) continue;
    const p = regla.puntos[tipo.id] ?? 0;
    anotar(etiquetaOrigen(regla.pregunta, regla.respuesta), p, regla.aFavor, regla.enContra);
  }

  // 2) Titulación
  const titulo = r.titulo as IdTitulacion | undefined;
  const eslora = esloraParaTi(tipo, titulo);
  if (titulo && esTitulacion(titulo)) {
    const nivelUsuario = TITULACIONES[titulo].nivel;
    const minima = TITULACIONES[tipo.titulacionMinima];
    const habitual = TITULACIONES[tipo.titulacionHabitual];
    const origen = etiquetaOrigen('titulo', titulo);
    if (nivelUsuario < minima.nivel) {
      descartado = `Necesitarías como mínimo: ${minima.nombre}.`;
    } else if (nivelUsuario < habitual.nivel) {
      anotar(
        origen,
        PUNTOS_TITULACION.soloPequenos,
        undefined,
        `Con tu titulación tendrías que limitarte a unidades de hasta ${num(eslora.max)} m; para los tamaños habituales hace falta ${habitual.corto}.`,
      );
    } else {
      anotar(origen, PUNTOS_TITULACION.cubreLoHabitual, 'Tu titulación te permite llevar los tamaños más habituales.');
    }
  }

  // 3) Presupuesto de compra.
  //    DESACTIVADA mientras `precioCompra` sea null en tiposBarco.ts (no hay precios verificados).
  //    Se activa sola en cuanto se rellenen los precios.
  const rangoCompra = r.compra ? RANGOS_COMPRA[r.compra] : undefined;
  if (rangoCompra && tipo.precioCompra) {
    const [minUsuario, maxUsuario] = rangoCompra;
    const origen = etiquetaOrigen('compra', r.compra!);
    if (tipo.precioCompra.min > maxUsuario) {
      anotar(
        origen,
        PUNTOS_COMPRA.fuera,
        undefined,
        `Incluso de segunda mano suele costar más de lo que quieres gastar (desde unos ${euros(tipo.precioCompra.min)}).`,
      );
    } else if (tipo.precioCompra.max >= minUsuario) {
      anotar(origen, PUNTOS_COMPRA.dentro, 'Hay unidades de segunda mano dentro de tu presupuesto de compra.');
    }
  }

  // 4) Presupuesto anual: misma fórmula que la calculadora, con lo que se puede estimar con datos
  //    verificados (amarre y mantenimiento básico). Es un rango PARCIAL: faltan seguro, combustible,
  //    inspección y tasas, así que solo puede decir "ya supera" o "lo estimable entra".
  const zona = (r.zona as IdZona | undefined) ?? 'med';
  const amarrePreferido = r.guardado as IdAmarre | undefined;
  const amarre: IdAmarre =
    amarrePreferido && tipo.guardado.includes(amarrePreferido) ? amarrePreferido : tipo.guardado[0];
  const entradasCalculadora = entradasPorDefecto(tipo.id, { zona, amarre, eslora: eslora.tipica });
  const desglose = costeAnual(entradasCalculadora);
  const incluidas = desglose.partidas.filter((p) => p.valor && p.valor.max > 0);
  const costeAnualEstimado: Rango | null = incluidas.length > 0 ? desglose.total : null;
  const costeIncluye = incluidas.map((p) => p.nombre.toLowerCase());

  const rangoAnual = r.anual ? RANGOS_ANUAL[r.anual] : undefined;
  if (rangoAnual && costeAnualEstimado) {
    const maxUsuario = rangoAnual[1];
    const origen = etiquetaOrigen('anual', r.anual!);
    const coste = textoRango(costeAnualEstimado);
    if (costeAnualEstimado.min > maxUsuario * PUNTOS_ANUAL.margen) {
      anotar(
        origen,
        PUNTOS_ANUAL.muyPorEncima,
        undefined,
        `Solo el amarre y el mantenimiento básico (${coste} al año, estimación orientativa) ya superan con creces lo que quieres gastar.`,
      );
    } else if (costeAnualEstimado.min > maxUsuario) {
      anotar(
        origen,
        PUNTOS_ANUAL.algoPorEncima,
        undefined,
        `Solo el amarre y el mantenimiento básico (${coste} al año, estimación orientativa) ya superan lo que quieres gastar.`,
      );
    } else if (costeAnualEstimado.max <= maxUsuario) {
      anotar(
        origen,
        PUNTOS_ANUAL.dentro,
        `Lo que podemos estimar (${coste} al año, sin seguro, combustible ni inspección) entra en lo que quieres gastar.`,
      );
    }
  }

  // Los motivos de más peso, primero.
  const ordenar = (lista: { texto: string; puntos: number }[]) =>
    [...lista].sort((a, b) => Math.abs(b.puntos) - Math.abs(a.puntos)).map((x) => x.texto);

  return {
    tipo,
    puntos,
    aFavor: ordenar(aFavor),
    enContra: ordenar(enContra),
    detalle,
    descartado,
    eslora,
    costeAnualEstimado,
    costeIncluye,
    entradasCalculadora,
  };
}

/** Puntúa todos los tipos y los devuelve ordenados (los descartados, al final). */
export function puntuarTodos(respuestas: Respuestas): Recomendacion[] {
  return LISTA_TIPOS_BARCO.map((t) => puntuar(t, respuestas)).sort((a, b) => {
    if (!!a.descartado !== !!b.descartado) return a.descartado ? 1 : -1;
    return b.puntos - a.puntos;
  });
}

/** Devuelve los 2 o 3 tipos más adecuados. */
export function recomendar(respuestas: Respuestas): Recomendacion[] {
  const todos = puntuarTodos(respuestas);
  const elegidos = todos.slice(0, SELECCION.maximo);

  // Quitamos el tercero si se queda muy lejos del primero, no suma nada o está descartado.
  if (elegidos.length === SELECCION.maximo) {
    const [primero, , tercero] = elegidos;
    if (
      tercero.descartado ||
      tercero.puntos <= 0 ||
      primero.puntos - tercero.puntos > SELECCION.distanciaMaximaTercero
    ) {
      elegidos.pop();
    }
  }
  return elegidos.slice(0, Math.max(SELECCION.minimo, elegidos.length));
}

/** Etiqueta de encaje para una recomendación. */
export function nivelEncaje(rec: Recomendacion) {
  if (rec.descartado) return { texto: 'Requiere más titulación', tono: 'bajo' as const };
  return NIVELES_ENCAJE.find((n) => rec.puntos >= n.desde)!;
}

/** Notas generales aplicables a estas respuestas. */
export function notasPara(respuestas: Respuestas): string[] {
  return NOTAS.filter((n) => respuestas[n.pregunta] === n.respuesta).map((n) => n.texto);
}

/** Para mostrar el nombre del tipo desde otros componentes sin importar tiposBarco. */
export const nombreTipo = (id: IdTipoBarco) => TIPOS_BARCO[id].nombre;
