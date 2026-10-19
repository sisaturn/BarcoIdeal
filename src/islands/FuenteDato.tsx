/**
 * <FuenteDato>: pie de sección con la fuente de los datos y la fecha de verificación.
 * Versión para componentes Preact (la de páginas estáticas es components/FuenteDato.astro).
 */
import { FECHA_VERIFICACION, FUENTES, type IdFuente } from '../data/fuentes';

interface Props {
  fuentes: IdFuente[];
  class?: string;
}

export default function FuenteDato({ fuentes, class: clase = '' }: Props) {
  const unicas = [...new Set(fuentes)].map((id) => FUENTES[id]);
  if (unicas.length === 0) return null;
  const legal = unicas.some((f) => f.tipo === 'legal');
  return (
    <p class={`border-t border-espuma-200 pt-3 text-xs leading-relaxed text-espuma-600 ${clase}`}>
      <span class="font-semibold text-espuma-700">{unicas.length > 1 ? 'Fuentes' : 'Fuente'}: </span>
      {unicas.map((f, i) => (
        <span key={f.id}>
          {i > 0 && ' · '}
          {f.url ? (
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              class="underline underline-offset-2 hover:text-mar-800"
            >
              {f.nombre}
            </a>
          ) : (
            <span>{f.nombre}</span>
          )}
          {f.editor && f.editor !== f.nombre ? ` (${f.editor})` : ''}
        </span>
      ))}
      . Verificado en {FECHA_VERIFICACION}. {!legal && <span>Precios orientativos de mercado.</span>}{' '}
      <a href="/fuentes/" class="underline underline-offset-2 hover:text-mar-800">
        Ver todas las fuentes
      </a>
    </p>
  );
}
