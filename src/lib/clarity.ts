/**
 * Microsoft Clarity (mapas de calor, grabaciones de sesión y resúmenes con IA).
 * Se carga SOLO si el usuario acepta la analítica en el aviso de cookies.
 * Documentación: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2
 */
import { CLARITY_PROJECT_ID } from '../config';

type FuncionClarity = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    clarity?: FuncionClarity;
  }
}

/** El id de proyecto de Clarity son letras minúsculas y números. Si no encaja, no se carga nada. */
export const clarityConfigurado = (id: string = CLARITY_PROJECT_ID) => /^[a-z0-9]{6,20}$/.test(id);

let cargado = false;

/** Carga el script de Clarity y le pasa el consentimiento (analítica sí, publicidad no). */
export function cargarClarity(id: string = CLARITY_PROJECT_ID): void {
  if (cargado || !clarityConfigurado(id) || typeof document === 'undefined') return;
  cargado = true;
  // Cola mínima (equivale al fragmento oficial): las llamadas se guardan hasta que llega el script.
  const cola: FuncionClarity =
    window.clarity ??
    Object.assign((...args: unknown[]) => {
      (cola.q ??= []).push(args);
    }, {});
  window.clarity = cola;
  window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}

/** Si el usuario retira el consentimiento: Clarity borra sus cookies y deja de seguir la sesión. */
export function retirarClarity(): void {
  if (typeof window === 'undefined') return;
  if (window.clarity) {
    window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
    window.clarity('consent', false);
  }
  // Por si acaso, borramos también las cookies propias de Clarity de este dominio.
  for (const nombre of ['_clck', '_clsk']) {
    document.cookie = `${nombre}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${nombre}=; Max-Age=0; path=/; domain=${location.hostname}; SameSite=Lax`;
  }
}

/** Evento propio en Clarity (p. ej. «test_completado»). No hace nada si Clarity no está cargado. */
export function eventoClarity(nombre: string): void {
  if (cargado && window.clarity) window.clarity('event', nombre);
}
