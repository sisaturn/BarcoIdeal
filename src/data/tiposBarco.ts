/**
 * TIPOS DE BARCO
 * --------------
 * Fichas de los tipos de barco que compara la web.
 *
 * Qué es cada cosa:
 *  - Textos, ventajas, inconvenientes, personas y rangos de eslora: CLASIFICACIÓN EDITORIAL de la web
 *    (para describir cada familia de barcos). No son datos normativos ni precios.
 *  - Titulación mínima y habitual: se CALCULAN con los datos legales verificados de titulaciones.ts.
 *  - Precio de compra: null mientras no haya datos verificados.
 *
 * Para añadir un tipo nuevo: añade su id a `IdTipoBarco`, crea su ficha en `FICHAS` y, si quieres,
 * puntos en recomendador.ts y su línea en alquiler.ts.
 */

import { LISTA_TITULACIONES, esloraMaximaPara, type IdTitulacion } from './titulaciones';

export type IdTipoBarco =
  'semirrigida' | 'lancha-open' | 'lancha-cabina' | 'velero-pequeno' | 'velero-crucero' | 'catamaran' | 'moto-agua';

export type Propulsion = 'motor' | 'vela';
/** Coincide con los ids de amarre de costes.ts y con las respuestas del test. */
export type Guardado = 'puerto' | 'seca' | 'remolque';

/** Ficha tal como se escribe en este archivo (textos y rangos editoriales). */
export interface TipoBarcoBase {
  id: IdTipoBarco;
  nombre: string;
  /** Una frase para tarjetas y listados. */
  resumen: string;
  /** Explicación cercana: qué es y para quién es. */
  descripcion: string;
  propulsion: Propulsion;
  /** Eslora orientativa en metros. `tipica` es la que se usa por defecto en la calculadora. */
  eslora: { min: number; max: number; tipica: number };
  /** Personas con las que se va cómodo (no es la capacidad legal máxima). */
  personasComodas: string;
  ventajas: string[];
  inconvenientes: string[];
  /**
   * Precio de compra de segunda mano, en euros. null = sin dato verificado.
   * TODO: completar con datos verificados (portales de compraventa, tasadores).
   */
  precioCompra: { min: number; max: number } | null;
  /** Formas de guardarlo que son realistas para este tipo. */
  guardado: Guardado[];
}

const FICHAS: Record<IdTipoBarco, TipoBarcoBase> = {
  semirrigida: {
    id: 'semirrigida',
    nombre: 'Neumática o semirrígida',
    resumen: 'Ligera, segura y fácil de mover. La navaja suiza para empezar.',
    descripcion:
      'Un casco con flotadores alrededor que la hacen muy estable y casi insumergible. Va bien para darse un baño en una cala, llevar a la familia o pescar un rato. Muchas caben en un remolque y se guardan en casa.',
    propulsion: 'motor',
    eslora: { min: 3.5, max: 7, tipica: 5.5 },
    personasComodas: '2 a 6',
    ventajas: [
      'Muy estable y segura, incluso con algo de mar',
      'Fácil de remolcar y guardar en casa o en marina seca',
      'Mantenimiento sencillo y barato',
    ],
    inconvenientes: [
      'Sin refugio: sol, viento y salpicaduras van contigo',
      'Poco espacio para guardar cosas',
      'Los flotadores se degradan con el sol y hay que cuidarlos',
    ],
    precioCompra: null, // TODO: precio de compra no verificado. Consultar portales de compraventa o un tasador náutico.
    guardado: ['remolque', 'seca', 'puerto'],
  },

  'lancha-open': {
    id: 'lancha-open',
    nombre: 'Lancha open',
    resumen: 'Cubierta abierta para el baño, el sol y la pesca de día.',
    descripcion:
      'Una lancha a motor sin camarote, con todo el espacio en cubierta: solárium, plataforma de baño y sitio para moverse. Es el barco de día por excelencia en verano.',
    propulsion: 'motor',
    eslora: { min: 5, max: 8, tipica: 6.5 },
    personasComodas: '4 a 8',
    ventajas: [
      'Mucho espacio en cubierta para tomar el sol y bañarse',
      'Sencilla de manejar y de mantener',
      'Cabe en marina seca hasta cierto tamaño',
      'Polivalente: baño, pesca y deportes acuáticos',
    ],
    inconvenientes: [
      'No hay dónde resguardarse ni dormir',
      'Consume bastante combustible si la usas a menudo',
      'Con mar formada se pasa mal',
    ],
    precioCompra: null, // TODO: precio de compra no verificado. Consultar portales de compraventa o un tasador náutico.
    guardado: ['seca', 'puerto', 'remolque'],
  },

  'lancha-cabina': {
    id: 'lancha-cabina',
    nombre: 'Lancha con cabina',
    resumen: 'Motor con camarote: para pasar el día entero o alguna noche.',
    descripcion:
      'Una lancha con un pequeño camarote y, a menudo, aseo. Te permite resguardarte, cambiarte o dormir a bordo alguna noche sin renunciar a la rapidez del motor.',
    propulsion: 'motor',
    eslora: { min: 6.5, max: 11, tipica: 8 },
    personasComodas: '4 a 8 de día, 2 a 4 para dormir',
    ventajas: [
      'Refugio contra el sol, el viento y la lluvia',
      'Permite dormir a bordo y hacer escapadas',
      'Rápida para cambiar de cala o volver a puerto',
    ],
    inconvenientes: [
      'Consumo de combustible alto',
      'Necesita amarre en puerto casi siempre',
      'Más mantenimiento: motor, instalación eléctrica, aseo…',
    ],
    precioCompra: null, // TODO: precio de compra no verificado. Consultar portales de compraventa o un tasador náutico.
    guardado: ['puerto', 'seca'],
  },

  'velero-pequeno': {
    id: 'velero-pequeno',
    nombre: 'Velero pequeño',
    resumen: 'Para aprender a navegar a vela y disfrutar del viento con poco gasto.',
    descripcion:
      'Desde una vela ligera hasta un pequeño velero de quilla con una cabina básica. Es la forma más barata y divertida de aprender a navegar de verdad: casi no gasta combustible y se aprende muchísimo.',
    propulsion: 'vela',
    eslora: { min: 4, max: 8, tipica: 6.5 },
    personasComodas: '1 a 4',
    ventajas: [
      'Pocos gastos de motor',
      'Casi sin gasto de combustible',
      'La mejor escuela para aprender a navegar',
      'Muchos se pueden remolcar',
    ],
    inconvenientes: [
      'Poco espacio y comodidad',
      'Dependes del viento para ir a algún sitio',
      'Requiere aprender técnica de vela',
    ],
    precioCompra: null, // TODO: precio de compra no verificado. Consultar portales de compraventa o un tasador náutico.
    guardado: ['remolque', 'puerto', 'seca'],
  },

  'velero-crucero': {
    id: 'velero-crucero',
    nombre: 'Velero crucero',
    resumen: 'Tu casa flotante a vela: travesías, fondeos y vacaciones a bordo.',
    descripcion:
      'Un velero con camarotes, cocina y baño, pensado para pasar días o semanas a bordo. Navega con poco gasto de combustible y es muy marinero, pero pide más conocimientos y más mantenimiento.',
    propulsion: 'vela',
    eslora: { min: 8, max: 14, tipica: 10 },
    personasComodas: '2 a 6 (para dormir)',
    ventajas: [
      'Muy marinero y seguro con mal tiempo',
      'Bajo consumo: el motor es solo de apoyo',
      'Se puede vivir a bordo temporadas',
    ],
    inconvenientes: [
      'Amarre en puerto obligatorio y caro en temporada',
      'Mantenimiento de jarcia, velas y motor',
      'Exige saber navegar a vela',
    ],
    precioCompra: null, // TODO: precio de compra no verificado. Consultar portales de compraventa o un tasador náutico.
    guardado: ['puerto'],
  },

  catamaran: {
    id: 'catamaran',
    nombre: 'Catamarán',
    resumen: 'Dos cascos: mucho espacio, estabilidad y comodidad para vivir a bordo.',
    descripcion:
      'Un barco de dos cascos, normalmente de vela (también los hay a motor). No escora, tiene muchísimo espacio y es ideal para grupos o para pasar temporadas a bordo. A cambio, comprarlo y mantenerlo cuesta bastante más.',
    propulsion: 'vela',
    eslora: { min: 10, max: 15, tipica: 12 },
    personasComodas: '4 a 10',
    ventajas: [
      'Estabilidad: apenas escora ni se balancea en el fondeo',
      'Espacio enorme en cubierta e interior',
      'Poco calado: entra en calas poco profundas',
    ],
    inconvenientes: [
      'Precio de compra alto',
      'Amarre caro: ocupa casi el doble de manga',
      'Doble de motores, cascos y mantenimiento',
    ],
    precioCompra: null, // TODO: precio de compra no verificado. Consultar portales de compraventa o un tasador náutico.
    guardado: ['puerto'],
  },

  'moto-agua': {
    id: 'moto-agua',
    nombre: 'Moto de agua',
    resumen: 'Adrenalina y velocidad para una o dos personas.',
    descripcion:
      'Pequeña, rápida y muy divertida. Va bien para disfrutar de la velocidad y moverse por la costa, pero no para pasar el día con la familia ni para llevar muchas cosas.',
    propulsion: 'motor',
    eslora: { min: 2.5, max: 4, tipica: 3.4 },
    personasComodas: '1 a 3',
    ventajas: ['Muy divertida y rápida', 'Fácil de remolcar y guardar en casa'],
    inconvenientes: [
      'Solo para 1 a 3 personas y sin espacio para nada',
      'Consumo alto para lo que es',
      'Muchas zonas de baño y embalses las restringen',
    ],
    precioCompra: null, // TODO: precio de compra no verificado. Consultar portales de compraventa o un tasador náutico.
    guardado: ['remolque', 'seca', 'puerto'],
  },
};

/**
 * Titulación mínima y habitual de cada tipo, CALCULADAS con los datos verificados de titulaciones.ts:
 *  - mínima: la de menor nivel cuya eslora máxima (motor o vela) cubre la eslora mínima del tipo;
 *  - habitual: la de menor nivel que cubre la eslora típica.
 * Excepción: para motos náuticas, la Licencia de Navegación (los datos dicen que "habilita motos náuticas").
 * Se asume que cada titulación incluye las atribuciones de las de menor nivel.
 */
export interface TipoBarco extends TipoBarcoBase {
  titulacionMinima: IdTitulacion;
  titulacionHabitual: IdTitulacion;
}

function titulacionQueCubre(eslora: number, propulsion: Propulsion): IdTitulacion {
  const t = LISTA_TITULACIONES.find((t) => {
    const max = esloraMaximaPara(t, propulsion);
    return max !== null && max >= eslora;
  });
  // Por encima de las esloras con dato (24 m), la de mayor nivel.
  return t?.id ?? LISTA_TITULACIONES[LISTA_TITULACIONES.length - 1].id;
}

function conTitulaciones(base: TipoBarcoBase): TipoBarco {
  if (base.id === 'moto-agua') return { ...base, titulacionMinima: 'licencia', titulacionHabitual: 'licencia' };
  return {
    ...base,
    titulacionMinima: titulacionQueCubre(base.eslora.min, base.propulsion),
    titulacionHabitual: titulacionQueCubre(base.eslora.tipica, base.propulsion),
  };
}

export const TIPOS_BARCO = Object.fromEntries(
  Object.entries(FICHAS).map(([id, base]) => [id, conTitulaciones(base)]),
) as Record<IdTipoBarco, TipoBarco>;

/** Lista en el orden en que se muestran en la web. */
export const LISTA_TIPOS_BARCO: TipoBarco[] = [
  TIPOS_BARCO.semirrigida,
  TIPOS_BARCO['lancha-open'],
  TIPOS_BARCO['lancha-cabina'],
  TIPOS_BARCO['velero-pequeno'],
  TIPOS_BARCO['velero-crucero'],
  TIPOS_BARCO.catamaran,
  TIPOS_BARCO['moto-agua'],
];

export function esTipoBarco(valor: unknown): valor is IdTipoBarco {
  // Object.hasOwn y no `in`: así 'toString' o 'constructor' no cuelan como tipo válido.
  return typeof valor === 'string' && Object.hasOwn(TIPOS_BARCO, valor);
}
