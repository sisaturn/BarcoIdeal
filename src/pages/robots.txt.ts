import type { APIRoute } from 'astro';

/** robots.txt generado en la build, con la URL del sitemap tomada de `site` (astro.config.mjs). */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap-index.xml', site).toString();
  const cuerpo = `User-agent: *
Allow: /

Sitemap: ${sitemap}
`;
  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
