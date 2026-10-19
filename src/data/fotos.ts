/**
 * FOTOGRAFÍAS Y CRÉDITOS
 * ----------------------
 * Las fotos de los tipos de barco vienen de Wikimedia Commons con licencia libre: se pueden usar
 * citando al autor y la licencia (y, en CC BY-SA, compartiendo con la misma licencia la foto
 * si se modifica). Los créditos se muestran en cada ficha y en /fuentes.
 *
 * Archivos: src/assets/barcos/<id>.jpg (versión de 1600-1920 px; Astro genera las versiones web).
 * Para cambiar una foto: sustituye el archivo y actualiza aquí su crédito.
 */

import type { IdTipoBarco } from './tiposBarco';

export interface CreditoFoto {
  /** Descripción para lectores de pantalla. */
  alt: string;
  autor: string;
  licencia: string;
  urlLicencia: string | null;
  /** Página de la foto en Wikimedia Commons. */
  origen: string | null;
  /**
   * Encuadre al recortar: clase de Tailwind object-[x%_y%] (no se usa style="" por la política de seguridad CSP).
   */
  encuadre: string;
}

export const FOTOS_BARCO: Record<IdTipoBarco, CreditoFoto> = {
  semirrigida: {
    alt: 'Semirrígida gris navegando con dos personas a bordo',
    autor: 'Bengt Nyman',
    licencia: 'CC BY 2.0',
    urlLicencia: 'https://creativecommons.org/licenses/by/2.0/',
    origen: 'https://commons.wikimedia.org/wiki/File:Brig_NZ7_2252_(49923778478).jpg',
    encuadre: 'object-[40%_60%]',
  },
  'lancha-open': {
    alt: 'Lancha open blanca amarrada en un pantalán',
    autor: 'Matti Blume',
    licencia: 'CC BY-SA 4.0',
    urlLicencia: 'https://creativecommons.org/licenses/by-sa/4.0/',
    origen: 'https://commons.wikimedia.org/wiki/File:Interboot_2023,_Friedrichshafen_(P1130440).jpg',
    encuadre: 'object-[50%_65%]',
  },
  'lancha-cabina': {
    alt: 'Lancha con cabina navegando junto a una boya roja',
    autor: 'Thomas Nugent',
    licencia: 'CC BY-SA 2.0',
    urlLicencia: 'https://creativecommons.org/licenses/by-sa/2.0/',
    origen: 'https://commons.wikimedia.org/wiki/File:Cabin_cruiser_off_Greenock_-_geograph.org.uk_-_8230789.jpg',
    encuadre: 'object-[60%_55%]',
  },
  'velero-pequeno': {
    alt: 'Velero ligero de una persona navegando en un río',
    autor: 'JamesBromberger',
    licencia: 'CC0',
    urlLicencia: 'https://creativecommons.org/publicdomain/zero/1.0/',
    origen:
      'https://commons.wikimedia.org/wiki/File:Laser_4.7_in_Perth_on_the_Swan_River,_Western_Australia,_May_2024.jpg',
    encuadre: 'object-[55%_60%]',
  },
  'velero-crucero': {
    alt: 'Velero crucero navegando con las velas desplegadas',
    autor: 'BavariaYachtbau',
    licencia: 'CC BY-SA 4.0',
    urlLicencia: 'https://creativecommons.org/licenses/by-sa/4.0/',
    origen: 'https://commons.wikimedia.org/wiki/File:Bavaria-yachts-c45-sailing.jpg',
    encuadre: 'object-[50%_50%]',
  },
  catamaran: {
    alt: 'Catamarán de crucero amarrado en un puerto',
    autor: 'Jpbazard',
    licencia: 'CC BY-SA 3.0',
    urlLicencia: 'https://creativecommons.org/licenses/by-sa/3.0/',
    origen: 'https://commons.wikimedia.org/wiki/File:Catamaran_de_croisi%C3%A8re_Lagoon_560.JPG',
    encuadre: 'object-[35%_60%]',
  },
  'moto-agua': {
    alt: 'Moto de agua navegando cerca de una playa con palmeras',
    autor: 'NorbertNagel',
    licencia: 'CC BY-SA 4.0',
    urlLicencia: 'https://creativecommons.org/licenses/by-sa/4.0/',
    origen: 'https://commons.wikimedia.org/wiki/File:Jet_Skiing_-_Mahe_-_Seychelles_-_2025.jpg',
    encuadre: 'object-[55%_55%]',
  },
};

/**
 * Foto de fondo de la portada y las cabeceras (yate frente a un acantilado).
 * Cedida por el titular de la web, que confirma tener derecho a publicarla.
 * TODO: si hay que citar al autor de la foto, indícalo aquí (se mostrará en /fuentes).
 */
export const FOTO_FONDO: { alt: string; autor: string | null; encuadre: string } = {
  alt: '',
  autor: null,
  encuadre: 'object-[50%_42%]',
};
