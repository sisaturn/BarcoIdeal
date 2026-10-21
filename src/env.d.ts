/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Endpoint de Formspree, p. ej. https://formspree.io/f/xxxxxxxx */
  readonly PUBLIC_FORMSPREE_ENDPOINT?: string;
  /** Id del proyecto de Microsoft Clarity (opcional). */
  readonly PUBLIC_CLARITY_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
