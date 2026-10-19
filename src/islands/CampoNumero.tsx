/**
 * Campo numérico tolerante con el formato español: acepta "6,5", "25.000" o "25000".
 * Mantiene el texto mientras se escribe y solo lo reformatea al salir del campo.
 * Un campo vacío significa "sin dato" (null), nunca 0.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { num } from '../lib/formato';

interface Props {
  id: string;
  /** null = vacío (sin dato). */
  valor: number | null;
  onCambio: (n: number | null) => void;
  /** 0 = entero (los puntos se toman como separador de miles); 1 o 2 = admite decimales. */
  decimales?: 0 | 1 | 2;
  min?: number;
  max?: number;
  sufijo?: string;
  placeholder?: string;
  /** id del texto de ayuda asociado (aria-describedby). */
  describedBy?: string;
  /** Etiqueta accesible si no hay <label for>. */
  ariaLabel?: string;
  class?: string;
}

export function parsearNumero(texto: string, decimales: 0 | 1 | 2): number | null {
  let t = texto.trim().replace(/\s|€/g, '');
  if (t === '') return null;
  if (decimales === 0) t = t.replace(/\./g, '').replace(',', '.');
  else t = t.replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function CampoNumero({
  id,
  valor,
  onCambio,
  decimales = 0,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  sufijo,
  placeholder,
  describedBy,
  ariaLabel,
  class: clase = '',
}: Props) {
  const formatear = (n: number | null) => (n === null ? '' : num(n, decimales));
  const [texto, setTexto] = useState(formatear(valor));
  const [error, setError] = useState(false);
  const enfocado = useRef(false);

  // Si el valor cambia desde fuera (p. ej. al cambiar de tipo de barco), actualizamos el texto.
  useEffect(() => {
    if (!enfocado.current) setTexto(formatear(valor));
  }, [valor]);

  const alEscribir = (t: string) => {
    setTexto(t);
    if (t.trim() === '') {
      setError(false);
      onCambio(null);
      return;
    }
    const n = parsearNumero(t, decimales);
    const valido = n !== null && n >= min && n <= max;
    setError(!valido);
    if (valido) onCambio(n);
  };

  const idError = `${id}-error`;

  return (
    <div class={clase}>
      <div class="relative">
        <input
          id={id}
          type="text"
          inputMode={decimales === 0 ? 'numeric' : 'decimal'}
          autoComplete="off"
          class={`campo tabular-nums ${sufijo ? 'pr-16' : ''} ${error ? 'border-baliza-600 focus:border-baliza-600 focus:ring-baliza-200' : ''}`}
          value={texto}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={error || undefined}
          aria-describedby={[describedBy, error ? idError : null].filter(Boolean).join(' ') || undefined}
          onFocus={() => (enfocado.current = true)}
          onInput={(ev) => alEscribir((ev.currentTarget as HTMLInputElement).value)}
          onBlur={() => {
            enfocado.current = false;
            setError(false);
            setTexto(formatear(valor));
          }}
        />
        {sufijo && (
          <span
            class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-espuma-600"
            aria-hidden="true"
          >
            {sufijo}
          </span>
        )}
      </div>
      {error && (
        <p id={idError} class="mt-1 text-sm font-semibold text-baliza-700">
          Introduce un número entre {num(min, decimales === 0 ? 0 : 2)} y {num(max, decimales === 0 ? 0 : 2)}.
        </p>
      )}
    </div>
  );
}
