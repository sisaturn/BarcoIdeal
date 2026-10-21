/**
 * Consentimiento de cookies de analítica (Microsoft Clarity).
 *
 * - La decisión se guarda SOLO en el navegador (localStorage), con la fecha.
 * - Sin decisión, o si es inválida o ha caducado, se vuelve a preguntar. Mientras tanto Clarity NO se carga.
 * - Caducidad: 12 meses (decisión propia, más prudente que el máximo de 24 meses que recomienda la AEPD).
 */
import { STORAGE_PREFIX } from '../config';

export const CLAVE_CONSENTIMIENTO = `${STORAGE_PREFIX}:consentimiento`;
/** Evento que se lanza en window al cambiar la decisión. */
export const EVENTO_CONSENTIMIENTO = 'barcoideal:consentimiento';
/** Evento para volver a abrir el aviso (enlace «Configurar cookies» del pie). */
export const EVENTO_ABRIR_AVISO = 'barcoideal:abrir-cookies';

const VERSION = 1;
const MESES_VALIDEZ = 12;

export interface Consentimiento {
  analitica: boolean;
  /** Fecha de la decisión (ISO). */
  fecha: string;
  version: number;
}

/** Valida un objeto leído del navegador. null si no es una decisión válida y vigente. */
export function validarConsentimiento(dato: unknown, ahora: Date = new Date()): Consentimiento | null {
  if (typeof dato !== 'object' || dato === null) return null;
  const d = dato as Record<string, unknown>;
  if (typeof d.analitica !== 'boolean' || d.version !== VERSION || typeof d.fecha !== 'string') return null;
  const fecha = new Date(d.fecha);
  if (Number.isNaN(fecha.getTime()) || fecha.getTime() > ahora.getTime() + 60_000) return null;
  const caduca = new Date(fecha);
  caduca.setMonth(caduca.getMonth() + MESES_VALIDEZ);
  if (caduca.getTime() <= ahora.getTime()) return null;
  return { analitica: d.analitica, fecha: d.fecha, version: VERSION };
}

export function leerConsentimiento(): Consentimiento | null {
  try {
    const crudo = localStorage.getItem(CLAVE_CONSENTIMIENTO);
    return crudo ? validarConsentimiento(JSON.parse(crudo)) : null;
  } catch {
    return null;
  }
}

export function guardarConsentimiento(analitica: boolean): Consentimiento {
  const c: Consentimiento = { analitica, fecha: new Date().toISOString(), version: VERSION };
  try {
    localStorage.setItem(CLAVE_CONSENTIMIENTO, JSON.stringify(c));
  } catch {
    // Navegación privada o almacenamiento bloqueado: la decisión vale solo para esta visita.
  }
  window.dispatchEvent(new CustomEvent(EVENTO_CONSENTIMIENTO, { detail: c }));
  return c;
}
