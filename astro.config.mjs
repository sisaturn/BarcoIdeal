// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// URL pública del sitio. Cámbiala cuando sepas la definitiva: la que te asigne Cloudflare Pages
// (https://<nombre-del-proyecto>.pages.dev) o tu dominio propio. Se usa para el sitemap,
// robots.txt, las URL canónicas y Open Graph. Este es el único sitio donde hay que cambiarla.
const SITE_URL = 'https://barcoideal.pages.dev';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    preact(),
    sitemap({
      // La página 404 no debe aparecer en el sitemap.
      filter: (page) => !page.includes('/404'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Nada de incrustar archivos pequeños como data: (fuentes, imágenes): todo se sirve como
      // archivo propio, así la CSP puede ser estricta (font-src 'self').
      assetsInlineLimit: 0,
    },
  },
  // No usamos bloques de código en Markdown; desactivarlo evita estilos en línea incompatibles con la CSP.
  markdown: {
    syntaxHighlight: false,
  },
  security: {
    /**
     * Política de seguridad de contenidos (CSP). Astro calcula en cada build el hash de cada
     * script y estilo en línea y genera una etiqueta <meta> en todas las páginas. El navegador
     * solo ejecutará el código de esta web: un script inyectado no se ejecutaría.
     *
     * Si añades un servicio externo (vídeos, mapas, otro formulario…), añade aquí su dominio.
     * Las directivas que no se pueden poner en <meta> (frame-ancestors) están en public/_headers.
     */
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        // Microsoft Clarity (solo se carga si el usuario acepta la analítica): dominios según Microsoft,
        // https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-csp
        "img-src 'self' data: https://*.clarity.ms https://c.bing.com",
        "font-src 'self'",
        // Formspree (formulario) y Cloudflare Web Analytics (si lo activas).
        "connect-src 'self' https://formspree.io https://cloudflareinsights.com https://*.clarity.ms https://c.bing.com",
        "form-action 'self' https://formspree.io",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-src 'none'",
        "worker-src 'none'",
        "manifest-src 'self'",
        'upgrade-insecure-requests',
      ],
      scriptDirective: {
        // El script de Cloudflare Web Analytics, por si lo activas desde BaseLayout.astro.
        // y Microsoft Clarity (www.clarity.ms y sus subdominios), solo con consentimiento.
        resources: [
          "'self'",
          'https://static.cloudflareinsights.com',
          'https://www.clarity.ms',
          'https://*.clarity.ms',
        ],
      },
      // Sin 'unsafe-inline': ni <style> ni atributos style="" inyectados se aplicarían.
      // (Los anchos de las barras los pone JavaScript, que la CSP no bloquea.)
      styleDirective: {
        resources: ["'self'"],
      },
    },
  },
});
