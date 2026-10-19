import type { ComponentChildren } from 'preact';

interface Props {
  titulo?: string;
  tono?: 'info' | 'atencion';
  children: ComponentChildren;
  class?: string;
}

/** Recuadro de aviso reutilizable en las islas (equivalente a components/Aviso.astro). */
export default function Aviso({ titulo, tono = 'atencion', children, class: clase = '' }: Props) {
  const estilos =
    tono === 'atencion' ? 'border-baliza-300 bg-baliza-50 text-baliza-800' : 'border-mar-200 bg-mar-50 text-mar-900';
  return (
    <div class={`flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${estilos} ${clase}`}>
      <svg class="mt-0.5 size-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
          clip-rule="evenodd"
        />
      </svg>
      <div>
        {titulo && <p class="font-bold">{titulo}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
