/** Icono de un tipo de barco para componentes Preact (equivalente a components/IconoBarco.astro). */
import type { IdTipoBarco } from '../data/tiposBarco';
import { ICONOS_BARCO, OLA } from '../lib/iconosBarco';

export default function IconoBarco({ tipo, class: clase = 'size-12' }: { tipo: IdTipoBarco; class?: string }) {
  return (
    <svg
      class={clase}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONOS_BARCO[tipo].map((t) => (
        <path
          key={t.d}
          d={t.d}
          fill={t.relleno ? 'currentColor' : 'none'}
          fill-opacity={t.relleno ? 0.14 : undefined}
        />
      ))}
      <path d={OLA} stroke-width="1.6" opacity="0.55" />
    </svg>
  );
}
