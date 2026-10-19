# Seguridad de BarcoIdeal

Ninguna web es 100 % inhackeable, pero esta tiene muy poca superficie de ataque. Este documento
resume qué protecciones hay en el código y qué tienes que configurar tú en tus cuentas, que es
donde suelen estar los riesgos reales de una web estática.

## Lo que ya hace el código

| Riesgo                                                               | Protección                                                                                                                                        | Dónde                                                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Inyección de scripts (XSS)                                           | CSP con hashes: solo se ejecutan los scripts de la propia web. Sin `unsafe-inline` ni `eval`. Preact escapa todo el texto; no se usa `innerHTML`. | `astro.config.mjs` → `security.csp`                  |
| Incrustar la web en otra (clickjacking)                              | `frame-ancestors 'none'` y `X-Frame-Options: DENY`                                                                                                | `public/_headers`                                    |
| Conexiones sin cifrar                                                | HSTS (1 año) y `upgrade-insecure-requests`                                                                                                        | `public/_headers`, CSP                               |
| Fugas de datos al salir de la web                                    | `Referrer-Policy: strict-origin-when-cross-origin` (no se envía la URL con las respuestas del test)                                               | `public/_headers`                                    |
| Uso de cámara, micro, ubicación…                                     | Desactivados con `Permissions-Policy`                                                                                                             | `public/_headers`                                    |
| Enlaces o datos manipulados (`?tipo=toString`, localStorage editado) | Todo lo que llega de la URL o del navegador se valida contra listas cerradas con `Object.hasOwn`                                                  | `src/lib/estado.ts`, `es*()` en `src/data`           |
| Spam y abuso del formulario                                          | Campo trampa, tiempo mínimo, espera entre envíos, límites de longitud, limpieza de caracteres invisibles, solo enlaces http/https                 | `src/islands/FormularioAyuda.tsx`                    |
| Dependencias con vulnerabilidades                                    | `npm audit` en cada push y cada semana; Dependabot abre PR con actualizaciones                                                                    | `.github/workflows/ci.yml`, `.github/dependabot.yml` |
| Código fuente expuesto                                               | No se publican source maps                                                                                                                        | por defecto en Astro                                 |
| Avisos de investigadores                                             | `/.well-known/security.txt` y página `/seguridad/`                                                                                                | `src/pages`                                          |

No hay secretos en el repositorio: el endpoint de Formspree es público por diseño (va en el
navegador de todos los visitantes). Nunca subas el archivo `.env` (ya está en `.gitignore`).

## Lo que tienes que hacer tú (importante)

### Cuentas

- [ ] **Verificación en dos pasos (2FA)** en GitHub, Cloudflare, Formspree y en el email de contacto.
      Si alguien entra en una de estas cuentas puede cambiar la web entera: es el riesgo número uno.
- [ ] Usa contraseñas únicas (un gestor de contraseñas ayuda).

### GitHub

- [ ] Protege la rama `main` (_Settings → Branches → Add rule_): exige que pase el CI antes de fusionar.
- [ ] Activa _Settings → Code security_: **Dependabot alerts**, **Dependabot security updates** y **Secret scanning**.

### Formspree

- [ ] Restringe el formulario a tu dominio (opción de dominios permitidos en la configuración del formulario, si tu plan la incluye).
- [ ] Activa el filtro de spam y, si empieza a llegar spam, la protección con CAPTCHA que ofrezca tu plan.
- [ ] Revisa los avisos de límite de envíos para enterarte si alguien intenta saturarlo.

### Cloudflare

- [ ] En el proyecto de Pages, solo tu cuenta debe tener acceso (_Manage account → Members_).
- [ ] Si conectas un **dominio propio**: activa _SSL/TLS → Full (strict)_, _Always Use HTTPS_,
      _Security → Bots → Bot Fight Mode_ y las reglas gestionadas del WAF que permita tu plan.
- [ ] Después de cambiar de dominio, actualiza `SITE_URL` en `astro.config.mjs`.

### Mantenimiento

- [ ] Acepta las PR de Dependabot cuando el CI esté en verde.
- [ ] Si añades un servicio externo (vídeo, mapa, otro formulario), añade su dominio en
      `security.csp` de `astro.config.mjs`. Si no, el navegador lo bloqueará: es la CSP haciendo su trabajo.
- [ ] Renueva `security.txt` desplegando al menos una vez al año (la fecha de caducidad se regenera en cada build).

## Comprobar las cabeceras tras desplegar

Revisa tu URL en un analizador de cabeceras de seguridad (por ejemplo, el _HTTP Observatory_ de Mozilla);
debería obtener una nota alta. Si algo de la web deja de funcionar, mira la consola del navegador: un
error que empiece por "Content Security Policy" indica qué dominio falta en la CSP.
