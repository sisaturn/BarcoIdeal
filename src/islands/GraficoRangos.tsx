/**
 * Gráfico de RANGOS en SVG, sin librerías: cada partida es una barra flotante del mínimo al máximo
 * sobre una escala común. Un importe exacto (tu dato) se dibuja como un punto.
 * Cada fila lleva su rango escrito, así que no depende del color ni del ratón.
 */
import { textoRango, type Rango } from '../lib/calculoCostes';

export interface FilaRango {
  id: string;
  etiqueta: string;
  rango: Rango;
}

interface Props {
  datos: FilaRango[];
  titulo: string;
}

const ALTO_FILA = 42;
const GROSOR = 12;
const ANCHO = 320;
const COLOR_RANGO = '#255c93'; // mar-600
const COLOR_PISTA = '#e2e8f0'; // espuma-200

export default function GraficoRangos({ datos, titulo }: Props) {
  const filas = datos.filter((d) => d.rango.max > 0).sort((a, b) => b.rango.max - a.rango.max);
  if (filas.length === 0) return null;
  const maximo = Math.max(...filas.map((d) => d.rango.max));
  const x = (v: number) => (v / maximo) * ANCHO;
  const alto = filas.length * ALTO_FILA;

  return (
    <figure>
      <figcaption class="mb-3 text-sm font-bold text-mar-950">{titulo}</figcaption>
      <svg
        viewBox={`0 0 ${ANCHO} ${alto}`}
        class="w-full overflow-visible"
        role="img"
        aria-label={`${titulo}. ${filas.map((d) => `${d.etiqueta}: ${textoRango(d.rango)}`).join('; ')}.`}
      >
        {filas.map((d, i) => {
          const y = i * ALTO_FILA;
          const exacto = Math.round(d.rango.min) === Math.round(d.rango.max);
          const x1 = x(d.rango.min);
          const ancho = Math.max(x(d.rango.max) - x1, 0);
          return (
            <g key={d.id}>
              <text x={0} y={y + 12} font-size="11" fill="#334155">
                {d.etiqueta}
              </text>
              <text x={ANCHO} y={y + 12} font-size="11" font-weight="700" text-anchor="end" fill="#0b1d33">
                {textoRango(d.rango)}
              </text>
              <rect x={0} y={y + 20} width={ANCHO} height={GROSOR} rx={GROSOR / 2} fill={COLOR_PISTA} opacity={0.7} />
              {exacto ? (
                <circle
                  cx={Math.min(Math.max(x1, GROSOR / 2), ANCHO - GROSOR / 2)}
                  cy={y + 20 + GROSOR / 2}
                  r={GROSOR / 2 + 1}
                  fill={COLOR_RANGO}
                  stroke="#ffffff"
                  stroke-width="2"
                />
              ) : (
                <rect
                  x={x1}
                  y={y + 20}
                  width={Math.max(ancho, GROSOR)}
                  height={GROSOR}
                  rx={GROSOR / 2}
                  fill={COLOR_RANGO}
                />
              )}
            </g>
          );
        })}
      </svg>
      <p class="mt-2 text-xs text-espuma-600">
        Cada barra va del mínimo al máximo orientativo; un punto es una cifra exacta (tu dato).
      </p>
    </figure>
  );
}
