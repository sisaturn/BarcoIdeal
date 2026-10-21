/**
 * PUERTOS QUE SE PUEDEN ELEGIR EN LA CALCULADORA
 * ----------------------------------------------
 * Lista de puertos y marinas para que el usuario indique dónde dejará su barco.
 *
 * Qué es cada cosa:
 *  - nombre, lugar y zona: identificación del puerto.
 *  - web: web oficial, comprobada el 21 de octubre de 2026 (responde y se identifica como ese puerto).
 *    null = no hemos podido verificarla; el comentario dice qué falta.
 *  - gestion: solo se indica cuando es un organismo público que cobra por tarifa (m²/día, GT…) o cuando
 *    los datos de amarres.ts lo dicen. null = no verificado: el usuario elige cómo le cobran.
 *  - tarifa: SOLO si hay tarifa verificada en amarres.ts (hoy, únicamente Alcaidesa Marina).
 *    PRECIO ORIENTATIVO DE MERCADO (esMercado): no incluye IVA ni tasas.
 *
 * Para añadir un puerto: añade su entrada a PUERTOS con un id nuevo (minúsculas y guiones).
 * Si consigues su tarifa oficial, añádela a amarres.ts con su fuente en fuentes.ts y enlázala aquí.
 */

import type { IdZona } from './costes';
import type { IdFuente } from './fuentes';
import type { Propulsion } from './tiposBarco';
import { TARIFAS_ALCAIDESA } from './amarres';

export const ES_MERCADO = true;

/** Día en que se comprobaron las webs de los puertos. */
export const FECHA_VERIFICACION_PUERTOS = '21 de octubre de 2026';

export type GestionPuerto = 'privada' | 'publico';

export interface Puerto {
  id: string;
  nombre: string;
  /** Municipio y provincia (o ámbito, si es un organismo con varios puertos). */
  lugar: string;
  zona: IdZona;
  gestion: GestionPuerto | null;
  web: string | null;
  /** Aclaración corta (p. ej. si agrupa varios puertos). */
  nota?: string;
  /** Tarifa anual verificada por eslora (sin IVA). */
  tarifa?: { fuente: IdFuente; precios: { eslora: number; euros: number; nota?: string }[] };
}

export const PUERTOS: Puerto[] = [
  // ---------------------------------------------------------------- Costa mediterránea
  {
    id: 'port-olimpic',
    nombre: 'Port Olímpic',
    lugar: 'Barcelona',
    zona: 'med',
    gestion: null,
    web: 'https://portolimpic.barcelona/',
  },
  {
    id: 'marina-port-vell',
    nombre: 'Marina Port Vell',
    lugar: 'Barcelona',
    zona: 'med',
    gestion: null,
    web: 'https://www.marinaportvell.com/',
    nota: 'Se presenta como marina para superyates.',
  },
  {
    id: 'port-forum',
    nombre: 'Port Fòrum',
    lugar: 'Sant Adrià de Besòs (Barcelona)',
    zona: 'med',
    gestion: null,
    web: 'https://www.portforum.com/',
  },
  {
    id: 'port-ginesta',
    nombre: 'Port Ginesta',
    lugar: 'Castelldefels (Barcelona)',
    zona: 'med',
    gestion: null,
    web: 'https://www.portginesta.com/',
  },
  {
    id: 'marina-palamos',
    nombre: 'Marina Palamós',
    lugar: 'Palamós (Girona)',
    zona: 'med',
    gestion: null,
    web: 'https://www.marinapalamos.com/',
  },
  {
    id: 'port-tarraco',
    nombre: 'Port Tarraco',
    lugar: 'Tarragona',
    zona: 'med',
    gestion: null,
    web: 'https://porttarraco.com/',
    nota: 'Se presenta como marina para superyates.',
  },
  {
    id: 'ports-generalitat',
    nombre: 'Puertos de la Generalitat de Catalunya',
    lugar: 'Cataluña (varios puertos)',
    zona: 'med',
    gestion: 'publico',
    web: 'https://ports.gencat.cat/',
    nota: 'Organismo público que gestiona varios puertos catalanes.',
  },
  {
    id: 'la-marina-valencia',
    nombre: 'La Marina de València',
    lugar: 'Valencia',
    zona: 'med',
    gestion: null,
    web: null, // TODO: web oficial no verificada (marinarealjuancarlosi.com ya no es suya). Buscarla en la web de la Autoridad Portuaria de Valencia.
  },
  {
    id: 'marina-denia',
    nombre: 'Marina de Dénia',
    lugar: 'Dénia (Alicante)',
    zona: 'med',
    gestion: null,
    web: 'https://marinadedenia.com/',
  },
  {
    id: 'marina-greenwich',
    nombre: 'Marina Greenwich',
    lugar: 'Altea (Alicante)',
    zona: 'med',
    gestion: null,
    web: 'https://marinagreenwich.com/',
  },
  {
    id: 'yacht-port-cartagena',
    nombre: 'Yacht Port Cartagena',
    lugar: 'Cartagena (Murcia)',
    zona: 'med',
    gestion: null,
    web: null, // TODO: yachtportcartagena.com no respondió al comprobarla. Volver a verificarla.
  },
  {
    id: 'almerimar',
    nombre: 'Puerto Deportivo de Almerimar',
    lugar: 'El Ejido (Almería)',
    zona: 'med',
    gestion: null,
    web: null, // TODO: almerimarpuerto.com no respondió al comprobarla. Volver a verificarla.
  },
  {
    id: 'benalmadena',
    nombre: 'Puerto Deportivo de Benalmádena',
    lugar: 'Benalmádena (Málaga)',
    zona: 'med',
    gestion: null,
    web: 'https://puertobenalmadena.es/',
  },
  {
    id: 'puerto-banus',
    nombre: 'Puerto Banús',
    lugar: 'Marbella (Málaga)',
    zona: 'med',
    gestion: null,
    web: 'https://puerto-banus.com/',
  },
  {
    id: 'sotogrande',
    nombre: 'Puerto Sotogrande',
    lugar: 'San Roque (Cádiz)',
    zona: 'med',
    gestion: null,
    web: 'https://puertosotogrande.es/',
  },
  {
    id: 'alcaidesa',
    nombre: 'Alcaidesa Marina',
    lugar: 'La Línea de la Concepción (Cádiz)',
    zona: 'med',
    gestion: 'privada',
    web: 'https://alcaidesamarina.com/',
    tarifa: { fuente: 'alcaidesaTarifas', precios: TARIFAS_ALCAIDESA },
  },
  {
    id: 'puertos-andalucia',
    nombre: 'Puertos de la Junta de Andalucía',
    lugar: 'Andalucía (varios puertos)',
    zona: 'med',
    gestion: 'publico',
    web: 'https://www.puertosdeandalucia.es/',
    nota: 'Organismo público con puertos en el Mediterráneo y en el Atlántico.',
  },

  // ---------------------------------------------------------------- Baleares
  {
    id: 'club-de-mar',
    nombre: 'Club de Mar Mallorca',
    lugar: 'Palma (Mallorca)',
    zona: 'bal',
    gestion: null,
    web: 'https://www.clubdemar-mallorca.com/',
  },
  {
    id: 'puerto-portals',
    nombre: 'Puerto Portals',
    lugar: 'Calvià (Mallorca)',
    zona: 'bal',
    gestion: null,
    web: 'https://puertoportals.com/',
  },
  {
    id: 'port-adriano',
    nombre: 'Port Adriano',
    lugar: 'Calvià (Mallorca)',
    zona: 'bal',
    gestion: null,
    web: 'https://www.portadriano.com/',
  },
  {
    id: 'marina-ibiza',
    nombre: 'Marina Ibiza',
    lugar: 'Ibiza',
    zona: 'bal',
    gestion: null,
    web: 'https://marinaibiza.com/',
  },
  {
    id: 'igy-ibiza',
    nombre: 'IGY Ibiza Marina',
    lugar: 'Ibiza',
    zona: 'bal',
    gestion: null,
    web: 'https://www.igymarinas.com/marinas/igy-ibiza-marina/',
    nota: 'Amarres para grandes yates.',
  },
  {
    id: 'marina-port-ibiza',
    nombre: 'Marina Port Ibiza',
    lugar: 'Ibiza',
    zona: 'bal',
    gestion: null,
    web: null, // TODO: web oficial no verificada. Hay un dato de prensa en amarres.ts (fuente marinaPortIbiza).
  },
  {
    id: 'ports-ib',
    nombre: 'Ports IB',
    lugar: 'Baleares (varios puertos)',
    zona: 'bal',
    gestion: 'publico',
    web: 'https://www.portsib.es/',
    nota: 'Organismo público del Govern balear que gestiona varios puertos de las islas.',
  },
  {
    id: 'ports-balears',
    nombre: 'Ports de Balears',
    lugar: 'Baleares (puertos del Estado)',
    zona: 'bal',
    gestion: 'publico',
    web: 'https://www.portsdebalears.com/',
    nota: 'Autoridad Portuaria de Baleares.',
  },

  // ---------------------------------------------------------------- Atlántico y Cantábrico
  {
    id: 'puerto-sherry',
    nombre: 'Puerto Sherry',
    lugar: 'El Puerto de Santa María (Cádiz)',
    zona: 'atl',
    gestion: null,
    web: 'https://www.puertosherry.com/',
  },
  {
    id: 'marina-coruna',
    nombre: 'Marina Coruña',
    lugar: 'A Coruña',
    zona: 'atl',
    gestion: null,
    web: 'https://marinacoruna.es/',
  },
  {
    id: 'rcn-vigo',
    nombre: 'Real Club Náutico de Vigo',
    lugar: 'Vigo (Pontevedra)',
    zona: 'atl',
    gestion: null,
    web: 'https://rcnauticovigo.com/',
  },
  {
    id: 'mrcy-baiona',
    nombre: 'Monte Real Club de Yates',
    lugar: 'Baiona (Pontevedra)',
    zona: 'atl',
    gestion: null,
    web: 'https://www.mrcyb.es/',
  },
  {
    id: 'gijon',
    nombre: 'Puerto Deportivo de Gijón',
    lugar: 'Gijón (Asturias)',
    zona: 'atl',
    gestion: null,
    web: 'https://puertodeportivogijon.es/',
  },
  {
    id: 'marina-cantabrico',
    nombre: 'Marina del Cantábrico',
    lugar: 'Camargo (Cantabria)',
    zona: 'atl',
    gestion: null,
    web: 'https://www.marinadelcantabrico.com/copromarina/web',
  },
  {
    id: 'getxo',
    nombre: 'Puerto Deportivo El Abra-Getxo',
    lugar: 'Getxo (Bizkaia)',
    zona: 'atl',
    gestion: null,
    web: null, // TODO: pdgetxo.eus daba error al comprobarla. Volver a verificarla.
  },
  {
    id: 'euskadi-publicos',
    nombre: 'Puertos públicos del País Vasco',
    lugar: 'Euskadi (varios puertos)',
    zona: 'atl',
    gestion: 'publico',
    web: 'https://www.euskadi.eus',
    nota: 'Cobran por m² y día (tarifa T-5). Hay un ejemplo de precio en la calculadora.',
  },

  // ---------------------------------------------------------------- Canarias
  {
    id: 'marina-rubicon',
    nombre: 'Marina Rubicón',
    lugar: 'Yaiza (Lanzarote)',
    zona: 'can',
    gestion: null,
    web: 'https://www.marinarubicon.com/',
  },
  {
    id: 'marina-lanzarote',
    nombre: 'Marina Lanzarote',
    lugar: 'Arrecife (Lanzarote)',
    zona: 'can',
    gestion: null,
    web: 'https://marinalanzarote.com/',
  },
  {
    id: 'puerto-calero',
    nombre: 'Puerto Calero',
    lugar: 'Yaiza (Lanzarote)',
    zona: 'can',
    gestion: null,
    web: null, // TODO: puertocalero.com no respondió al comprobarla. Volver a verificarla.
  },
  {
    id: 'las-palmas',
    nombre: 'Muelle Deportivo de Las Palmas',
    lugar: 'Las Palmas de Gran Canaria',
    zona: 'can',
    gestion: 'publico',
    web: 'https://www.palmasport.es/es/',
    nota: 'Lo gestiona la Autoridad Portuaria de Las Palmas.',
  },
];

const POR_ID: Record<string, Puerto> = Object.fromEntries(PUERTOS.map((p) => [p.id, p]));

export function esPuerto(valor: unknown): valor is string {
  // Object.hasOwn y no `in`: así 'toString' o 'constructor' no cuelan como puerto válido.
  return typeof valor === 'string' && Object.hasOwn(POR_ID, valor);
}

export function puertoPorId(id: string | null): Puerto | null {
  return id !== null && esPuerto(id) ? POR_ID[id] : null;
}

/**
 * Tarifa verificada del puerto para una eslora: la fila igual o inmediatamente superior.
 * Si hay dos filas para la misma eslora (veleros / motor), se usa la de la propulsión del barco.
 * null si el puerto no tiene tarifa verificada o la eslora supera la tabla.
 */
export function tarifaPuertoPara(
  puerto: Puerto | null,
  eslora: number,
  propulsion: Propulsion,
): { eslora: number; euros: number; fuente: IdFuente } | null {
  if (!puerto?.tarifa) return null;
  const candidatas = puerto.tarifa.precios.filter((p) => eslora <= p.eslora);
  if (candidatas.length === 0) return null;
  const esloraFila = Math.min(...candidatas.map((p) => p.eslora));
  const filas = candidatas.filter((p) => p.eslora === esloraFila);
  const nota = propulsion === 'vela' ? 'veleros' : 'motor';
  const fila = filas.find((p) => p.nota === nota) ?? filas.find((p) => !p.nota) ?? filas[0];
  return { eslora: fila.eslora, euros: fila.euros, fuente: puerto.tarifa.fuente };
}
