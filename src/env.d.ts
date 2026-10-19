/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Endpoint de Formspree, p. ej. https://formspree.io/f/xxxxxxxx */
  readonly PUBLIC_FORMSPREE_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
