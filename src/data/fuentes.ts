/**
 * REGISTRO DE FUENTES
 * -------------------
 * Todas las fuentes que usa la web, en un solo sitio. Cada dato de /src/data apunta a una o
 * varias de estas fuentes por su id, y la página /fuentes las lista todas.
 *
 * tipo:
 *  - 'legal'   → normativa oficial (BOE, Ministerio de Transportes, DGT). Se muestra como hecho.
 *  - 'mercado' → precios orientativos de mercado. Se muestran SIEMPRE como "estimación orientativa".
 *
 * url: null significa que no tenemos el enlace exacto verificado; el comentario dice qué falta.
 */

export type TipoFuente = 'legal' | 'mercado';

export interface Fuente {
  id: string;
  nombre: string;
  /** Organismo o medio que la publica. */
  editor: string;
  tipo: TipoFuente;
  url: string | null;
  /** Mes en que se verificó el dato. */
  verificado: string;
}

/** Fecha de verificación de todos los datos actuales. */
export const FECHA_VERIFICACION = 'octubre de 2026';

const f = (fuente: Omit<Fuente, 'verificado'>): Fuente => ({ ...fuente, verificado: FECHA_VERIFICACION });

export const FUENTES = {
  // ---------------------------------------------------------------- Normativa: titulaciones
  rd875: f({
    id: 'rd875',
    nombre:
      'Real Decreto 875/2014, por el que se regulan las titulaciones náuticas para el gobierno de las embarcaciones de recreo',
    editor: 'BOE',
    tipo: 'legal',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2014-10344',
  }),
  mitmaLicencia: f({
    id: 'mitmaLicencia',
    nombre: 'Licencia de Navegación',
    editor: 'Ministerio de Transportes (transportes.gob.es)',
    tipo: 'legal',
    url: 'https://www.transportes.gob.es/marina-mercante/titulaciones/titulaciones-de-recreo/titulos/licencia-de-navegacion',
  }),
  mitmaPnb: f({
    id: 'mitmaPnb',
    nombre: 'Patrón de Navegación Básica',
    editor: 'Ministerio de Transportes (transportes.gob.es)',
    tipo: 'legal',
    url: 'https://www.transportes.gob.es/marina-mercante/titulaciones/titulaciones-de-recreo/titulos/patron-de-navegacion-basica/patronpara-navegacion-basica-pnb',
  }),
  mitmaPer: f({
    id: 'mitmaPer',
    nombre: 'Patrón de Embarcaciones de Recreo',
    editor: 'Ministerio de Transportes (transportes.gob.es)',
    tipo: 'legal',
    url: 'https://www.transportes.gob.es/marina-mercante/titulaciones/titulaciones-de-recreo/titulos/patron-de-embarcaciones-recreo/patron-de-embarcaciones-de-recreo-per',
  }),
  mitmaPy: f({
    id: 'mitmaPy',
    nombre: 'Patrón de Yate',
    editor: 'Ministerio de Transportes (transportes.gob.es)',
    tipo: 'legal',
    url: 'https://www.transportes.gob.es/marina-mercante/titulaciones/titulaciones-de-recreo/titulos/patron-de-yate/patronde-yate',
  }),
  mitmaCy: f({
    id: 'mitmaCy',
    nombre: 'Capitán de Yate',
    editor: 'Ministerio de Transportes (transportes.gob.es)',
    tipo: 'legal',
    url: 'https://www.transportes.gob.es/marina-mercante/titulaciones/titulaciones-de-recreo/titulos/capitan-de-yate',
  }),

  // ---------------------------------------------------------------- Normativa: seguro
  rd607: f({
    id: 'rd607',
    nombre:
      'Real Decreto 607/1999, Reglamento del seguro de responsabilidad civil de suscripción obligatoria para embarcaciones de recreo o deportivas',
    editor: 'BOE',
    tipo: 'legal',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1999-9655',
  }),
  mitmaSeguro: f({
    id: 'mitmaSeguro',
    nombre: 'Seguro obligatorio de embarcaciones de recreo',
    editor: 'Ministerio de Transportes (transportes.gob.es)',
    tipo: 'legal',
    url: 'https://www.transportes.gob.es/marina-mercante/nautica-de-recreo/seguro-obligatorio/legislacion/legislacion-relativa-al-seguro-obligatorio-de-embarcaciones-de-recreo',
  }),

  // ---------------------------------------------------------------- Normativa: inspección
  rd1434: f({
    id: 'rd1434',
    nombre: 'Real Decreto 1434/1999, reconocimientos e inspecciones de las embarcaciones de recreo',
    editor: 'BOE',
    tipo: 'legal',
    url: 'https://www.boe.es/buscar/doc.php?id=BOE-A-1999-18663',
  }),
  mitmaInspeccion: f({
    id: 'mitmaInspeccion',
    nombre: 'Inspecciones y certificado de navegabilidad (tabla de periodicidad)',
    editor: 'Ministerio de Transportes (transportes.gob.es)',
    tipo: 'legal',
    url: 'https://www.transportes.gob.es/marina-mercante/nautica-de-recreo/documentacion-administrativa/inspecciones-y-certificado-de-navegabilidad/inspeccion-de-embarcaciones-de-recreo-itby-certificado-de-navegabilidad',
  }),

  // ---------------------------------------------------------------- Normativa: impuestos y registro
  ley38: f({
    id: 'ley38',
    nombre: 'Ley 38/1992, de Impuestos Especiales (arts. 65 y 66)',
    editor: 'BOE',
    tipo: 'legal',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1992-28741',
  }),
  dgtV1307: f({
    id: 'dgtV1307',
    nombre: 'Consulta vinculante V1307/2025',
    editor: 'Dirección General de Tributos',
    tipo: 'legal',
    // TODO: falta el enlace directo. Buscar "V1307-25" en la base de datos de consultas
    // tributarias de la Dirección General de Tributos (Ministerio de Hacienda).
    url: null,
  }),
  rd1435: f({
    id: 'rd1435',
    nombre: 'Real Decreto 1435/2010, abanderamiento y matriculación de las embarcaciones de recreo',
    editor: 'BOE',
    tipo: 'legal',
    url: 'https://www.boe.es/buscar/doc.php?id=BOE-A-2010-17038',
  }),
  mitmaAbanderamiento: f({
    id: 'mitmaAbanderamiento',
    nombre: 'Abanderamiento y matriculación de embarcaciones de recreo',
    editor: 'Ministerio de Transportes (transportes.gob.es)',
    tipo: 'legal',
    url: 'https://www.transportes.gob.es/marina-mercante/nautica-de-recreo/documentacion-administrativa/abanderamiento-matricula-y-registro/abanderamiento',
  }),

  // ---------------------------------------------------------------- Mercado: amarres
  alcaidesaTarifas: f({
    id: 'alcaidesaTarifas',
    nombre: 'Tarifas 2026 de amarre',
    editor: 'Alcaidesa Marina',
    tipo: 'mercado',
    url: 'https://www.alcaidesamarina.com',
  }),
  euskadiPuertos: f({
    id: 'euskadiPuertos',
    nombre: 'Tarifas de los puertos públicos del País Vasco 2025-2026 (T-5)',
    editor: 'Gobierno Vasco (euskadi.eus)',
    tipo: 'mercado',
    url: 'https://www.euskadi.eus',
  }),
  portsBalears: f({
    id: 'portsBalears',
    nombre: 'Tarifas de puertos públicos de Baleares',
    editor: 'Ports de Balears / Autoridad Portuaria de Baleares (APB)',
    tipo: 'mercado',
    // TODO: falta el enlace exacto a las tarifas de Ports de Balears / APB.
    url: null,
  }),
  marinaPortIbiza: f({
    id: 'marinaPortIbiza',
    nombre: 'Precio de amarre en Marina Port Ibiza',
    editor: 'Marina Port Ibiza (dato de prensa)',
    tipo: 'mercado',
    // TODO: falta la publicación concreta de la que sale el dato (medio y enlace).
    url: null,
  }),
  mallorcaCom: f({
    id: 'mallorcaCom',
    nombre: 'Precios de amarres en Mallorca',
    editor: 'Mallorca.com',
    tipo: 'mercado',
    url: 'https://www.mallorca.com',
  }),
  araCat: f({
    id: 'araCat',
    nombre: 'Comparativa de precios de amarres (Costa Brava)',
    editor: 'Ara.cat',
    tipo: 'mercado',
    url: 'https://www.ara.cat',
  }),

  // ---------------------------------------------------------------- Mercado: seguro
  roams: f({
    id: 'roams',
    nombre: 'Precios de seguros de embarcaciones',
    editor: 'Roams',
    tipo: 'mercado',
    // TODO: falta el enlace a la página concreta consultada.
    url: null,
  }),
  mapfre: f({
    id: 'mapfre',
    nombre: 'Seguros de embarcaciones',
    editor: 'Mapfre',
    tipo: 'mercado',
    // TODO: falta el enlace a la página concreta consultada.
    url: null,
  }),

  // ---------------------------------------------------------------- Mercado: mantenimiento
  merca2: f({
    id: 'merca2',
    nombre: 'Coste de mantenimiento de un barco (prensa náutica)',
    editor: 'Merca2',
    tipo: 'mercado',
    // TODO: falta el enlace al artículo concreto.
    url: null,
  }),
  barcheamotore: f({
    id: 'barcheamotore',
    nombre: 'Coste de mantenimiento de un barco (prensa náutica)',
    editor: 'Barcheamotore',
    tipo: 'mercado',
    // TODO: falta el enlace al artículo concreto.
    url: null,
  }),
  // ---------------------------------------------------------------- Mercado: mantenimiento del motor
  todobarco: f({
    id: 'todobarco',
    nombre: '¿Cuánto cuesta mantener un barco en 2026? (revisión anual del motor hasta 10 m)',
    editor: 'Todobarco (blog, 02-01-2026)',
    tipo: 'mercado',
    url: 'https://todobarco.com/blog/cuanto-cuesta-mantener-barco/42',
  }),
  seatravel: f({
    id: 'seatravel',
    nombre: '¿Cuánto cuesta mantener una embarcación de recreo? (mantenimiento del motor)',
    editor: 'Seatravel (blog, 11-09-2024)',
    tipo: 'mercado',
    url: 'https://www.seatravel.es/seatravel/mantener-embarcacion-recreo-barco/',
  }),
  emotionsbylu: f({
    id: 'emotionsbylu',
    nombre: '¿Cuánto cuesta mantener un barco? (motores intraborda, dos motores y generador)',
    editor: 'Emotions by Lu (blog, sin fecha)',
    tipo: 'mercado',
    url: 'https://emotionsbylu.com/cuanto-cuesta-mantener-un-barco-lo-que-debes-de-saber-antes-de-comprar/',
  }),
  buscamostubarco: f({
    id: 'buscamostubarco',
    nombre: 'Cuánto cuesta mantener un barco al año (motores fueraborda)',
    editor: 'Buscamos tu barco (blog, sin fecha)',
    tipo: 'mercado',
    url: 'https://buscamostubarco.com/cuanto-cuesta-mantener-un-barco-al-ano-guia-realista/',
  }),
  mercuryMantenimiento: f({
    id: 'mercuryMantenimiento',
    nombre: 'Mantenimiento de motores fueraborda de cuatro tiempos (cada 100 horas o una vez al año)',
    editor: 'Mercury Marine (fabricante)',
    tipo: 'mercado',
    url: 'https://www.mercurymarine.com/es/us/dockline/four-stroke-maintenance/',
  }),
  yanmarMantenimiento: f({
    id: 'yanmarMantenimiento',
    nombre: 'Mantenimiento periódico de motores diésel marinos (revisiones a las 50, 250, 500 y 750 horas)',
    editor: 'Yanmar (fabricante)',
    tipo: 'mercado',
    url: 'https://yanmar.com/marine/fr/?p=20336',
  }),
  alcaidesaVaradero: f({
    id: 'alcaidesaVaradero',
    nombre: 'Tarifas del varadero (boatyard)',
    editor: 'Alcaidesa Marina',
    tipo: 'mercado',
    url: 'https://www.alcaidesamarina.com',
  }),
} satisfies Record<string, Fuente>;

export type IdFuente = keyof typeof FUENTES;

export const LISTA_FUENTES: Fuente[] = Object.values(FUENTES);
