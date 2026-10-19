/**
 * Insignia que distingue, en la interfaz, el tipo de dato:
 *  - legal    → dato legal verificado (normativa oficial)
 *  - mercado  → estimación orientativa de mercado
 *  - usuario  → cifra escrita por el usuario
 *  - sinDato  → no hay dato verificado
 */
export type TipoInsignia = 'legal' | 'mercado' | 'usuario' | 'sinDato';

const ESTILOS: Record<TipoInsignia, { texto: string; clase: string }> = {
  legal: { texto: 'Dato legal', clase: 'bg-mar-700 text-white' },
  mercado: { texto: 'Estimación orientativa', clase: 'bg-baliza-100 text-baliza-800' },
  usuario: { texto: 'Tu dato', clase: 'bg-mar-100 text-mar-900' },
  sinDato: { texto: 'Sin dato', clase: 'bg-espuma-200 text-espuma-700' },
};

export default function Insignia({ tipo, texto }: { tipo: TipoInsignia; texto?: string }) {
  const e = ESTILOS[tipo];
  return (
    <span class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap ${e.clase}`}>
      {texto ?? e.texto}
    </span>
  );
}
