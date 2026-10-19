import type { APIRoute } from 'astro';
import { CONTACT_EMAIL } from '../../config';

/**
 * security.txt (RFC 9116): dice a quien encuentre un fallo de seguridad cómo avisarte.
 * Se regenera en cada build con el email de src/config.ts y caduca a los 12 meses del último despliegue.
 */
export const GET: APIRoute = ({ site }) => {
  const caduca = new Date();
  caduca.setFullYear(caduca.getFullYear() + 1);
  const cuerpo = `Contact: mailto:${CONTACT_EMAIL}
Expires: ${caduca.toISOString()}
Preferred-Languages: es, en
Canonical: ${new URL('/.well-known/security.txt', site).toString()}
Policy: ${new URL('/seguridad/', site).toString()}
`;
  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
