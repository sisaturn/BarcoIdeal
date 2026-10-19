/**
 * Configuración general del sitio.
 * Cambia aquí el nombre, la URL o los datos de contacto y se actualizan en toda la web.
 */

/** Nombre de la web. Es provisional: cámbialo aquí y se actualiza en todas las páginas. */
export const SITE_NAME = 'BarcoIdeal';

/** Lema corto que acompaña al nombre (pestaña del navegador, Open Graph…). */
export const SITE_TAGLINE = 'Descubre qué barco te conviene y cuánto cuesta de verdad';

/**
 * URL pública del sitio, sin barra final.
 * Se toma automáticamente de `site` en astro.config.mjs: cámbiala solo allí.
 */
export const SITE_URL: string = (import.meta.env.SITE ?? '').replace(/\/$/, '');

/** Email de contacto que aparece en las páginas legales y en el pie. */
export const CONTACT_EMAIL = 'barcoideal97@gmail.com';

/** Nombre del titular de la web (aparece en las páginas legales). */
export const OWNER_NAME = 'Álvaro Alonso';

/**
 * Endpoint de Formspree para el formulario de ayuda personalizada.
 * Se lee de la variable de entorno PUBLIC_FORMSPREE_ENDPOINT (ver .env.example).
 * Si no está definida se usa el marcador FORMSPREE_ENDPOINT y el formulario
 * avisará de que todavía no está configurado.
 */
export const FORMSPREE_ENDPOINT: string = import.meta.env.PUBLIC_FORMSPREE_ENDPOINT || 'FORMSPREE_ENDPOINT';

/** Prefijo de las claves que se guardan en el navegador del usuario (localStorage). */
export const STORAGE_PREFIX = 'barcoideal';

/** Imagen por defecto para Open Graph (redes sociales). Está en /public. */
export const DEFAULT_OG_IMAGE = '/og-default.png';

/** Locale para Open Graph y formato de números. */
export const LOCALE = 'es-ES';
