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
export const OWNER_NAME = 'Álvaro Alonso Alejos';

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

/**
 * Código de verificación de Google Search Console (método «Etiqueta HTML»).
 * Pega aquí SOLO el valor de content="…" que te da Google y vuelve a desplegar.
 * Mientras esté vacío no se añade nada a la web.
 */
export const GOOGLE_SITE_VERIFICATION = '';

/**
 * Id del proyecto de Microsoft Clarity (analítica con mapas de calor y grabaciones).
 * Está en Clarity → Settings → Overview → «Project ID» (p. ej. "abcd1234ef"). Es público: aparece en la web.
 * Vacío = Clarity desactivado y sin aviso de cookies. También se puede dar con la variable de entorno
 * PUBLIC_CLARITY_PROJECT_ID (Cloudflare Pages → Settings → Variables).
 */
export const CLARITY_PROJECT_ID: string = (import.meta.env.PUBLIC_CLARITY_PROJECT_ID ?? '').trim() || 'z14v0veg7r';

/** Otras formas de escribir el nombre, para que Google asocie las búsquedas a la web. */
export const SITE_ALTERNATE_NAMES = ['barcoideal', 'Barco Ideal'];

/** Locale para Open Graph y formato de números. */
export const LOCALE = 'es-ES';
