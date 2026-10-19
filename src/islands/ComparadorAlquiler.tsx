/**
 * "¿Comprar o alquilar?": compara el coste de tener el barco (rango) con alquilar uno parecido.
 * No hay datos verificados de alquiler ni de amortización: el usuario escribe los suyos.
 */
import { useMemo, useState } from 'preact/hooks';
import { MATICES_ALQUILER } from '../data/alquiler';
import { TIPOS_BARCO } from '../data/tiposBarco';
import { textoRango, type Desglose, type EntradasCalculo } from '../lib/calculoCostes';
import { comparar } from '../lib/comparador';
import { euros, num } from '../lib/formato';
import CampoNumero from './CampoNumero';
import GraficoRangos from './GraficoRangos';
import Insignia from './Insignia';

interface Props {
  entradas: EntradasCalculo;
  desglose: Desglose;
  diasUso?: number;
  onDias: (dias: number | undefined) => void;
}

export default function ComparadorAlquiler({ entradas, desglose, diasUso, onDias }: Props) {
  const [sinPatron, setSinPatron] = useState<number | null>(null);
  const [conPatron, setConPatron] = useState<number | null>(null);
  const [amortizacionPct, setAmortizacionPct] = useState<number | null>(null);
  const tipo = TIPOS_BARCO[entradas.tipo];

  const c = useMemo(
    () =>
      comparar(entradas, desglose, {
        dias: diasUso ?? null,
        precioSinPatron: sinPatron,
        precioConPatron: conPatron,
        amortizacion: amortizacionPct === null ? null : amortizacionPct / 100,
      }),
    [entradas, desglose, diasUso, sinPatron, conPatron, amortizacionPct],
  );

  const faltan: string[] = [];
  if (!diasUso) faltan.push('los días que navegarías al año');
  if (sinPatron === null && conPatron === null) faltan.push('el precio por día de un alquiler en tu zona');

  const equilibrio = c?.sinPatron?.diasEquilibrio ?? c?.conPatron?.diasEquilibrio ?? null;
  const referencia = c?.sinPatron ? 'sin patrón' : 'con patrón';

  return (
    <section id="comprar-o-alquilar" class="tarjeta scroll-mt-24 lg:col-start-1" aria-labelledby="titulo-comparador">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="eyebrow">Comparador</p>
        <Insignia tipo="usuario" texto="Con tus precios" />
      </div>
      <h2 id="titulo-comparador" class="mt-1 text-xl font-bold">
        ¿Comprar o alquilar?
      </h2>
      <p class="mt-1 text-sm text-espuma-600">
        No tenemos precios de alquiler verificados: pide precio a una empresa de chárter de tu zona para un barco
        parecido a tu {tipo.nombre.toLowerCase()} y escríbelo aquí.
      </p>

      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label for="c-dias-comparador" class="etiqueta-campo">
            Días que navegarías al año
          </label>
          <CampoNumero
            id="c-dias-comparador"
            valor={diasUso ?? null}
            onCambio={(n) => onDias(n && n > 0 ? n : undefined)}
            min={1}
            max={365}
            sufijo="días"
          />
        </div>
        <div>
          <label for="c-amortizacion" class="etiqueta-campo">
            Pérdida de valor al año <span class="font-normal text-espuma-600">(opcional)</span>
          </label>
          <CampoNumero
            id="c-amortizacion"
            valor={amortizacionPct}
            onCambio={setAmortizacionPct}
            decimales={1}
            min={0}
            max={50}
            sufijo="%"
            describedBy="c-amortizacion-ayuda"
          />
          <p id="c-amortizacion-ayuda" class="ayuda-campo">
            Sin dato verificado. Si lo sabes (tasador, anuncios), escríbelo.
          </p>
        </div>
        <div>
          <label for="c-alquiler-sin" class="etiqueta-campo">
            Alquiler sin patrón, por día
          </label>
          <CampoNumero
            id="c-alquiler-sin"
            valor={sinPatron}
            onCambio={setSinPatron}
            min={1}
            max={100_000}
            sufijo="€/día"
          />
        </div>
        <div>
          <label for="c-alquiler-con" class="etiqueta-campo">
            Alquiler con patrón, por día
          </label>
          <CampoNumero
            id="c-alquiler-con"
            valor={conPatron}
            onCambio={setConPatron}
            min={1}
            max={100_000}
            sufijo="€/día"
          />
        </div>
      </div>

      {faltan.length > 0 || !c ? (
        <p class="mt-5 rounded-xl bg-espuma-100 p-4 text-sm text-espuma-700">
          Para comparar, indica {faltan.join(' y ')}.
        </p>
      ) : (
        <>
          <div class="mt-6">
            <GraficoRangos
              titulo={`Coste anual con ${num(c.dias, 0)} días de uso`}
              datos={[
                { id: 'tener', etiqueta: 'Tener tu barco', rango: c.costeTener },
                ...(c.sinPatron
                  ? [
                      {
                        id: 'sin',
                        etiqueta: 'Alquilar sin patrón',
                        rango: { min: c.sinPatron.total, max: c.sinPatron.total },
                      },
                    ]
                  : []),
                ...(c.conPatron
                  ? [
                      {
                        id: 'con',
                        etiqueta: 'Alquilar con patrón',
                        rango: { min: c.conPatron.total, max: c.conPatron.total },
                      },
                    ]
                  : []),
              ]}
            />
          </div>

          <div class="mt-4 rounded-xl bg-mar-50 p-4 text-mar-900" aria-live="polite">
            {equilibrio && equilibrio.min === null && equilibrio.max === null ? (
              <p>
                <strong>Con estos precios, alquilar ({referencia}) sale más barato aunque navegues todo el año.</strong>
              </p>
            ) : equilibrio ? (
              <p>
                <strong>
                  Tener barco empezaría a compensar a partir de{' '}
                  {equilibrio.min === equilibrio.max
                    ? `unos ${num(equilibrio.min ?? 365, 0)} días`
                    : `entre ${num(equilibrio.min ?? 365, 0)} y ${equilibrio.max === null ? 'más de 365' : num(equilibrio.max, 0)} días`}{' '}
                  al año
                </strong>{' '}
                frente a alquilar {referencia}. El rango depende sobre todo de lo que cueste tu amarre.
              </p>
            ) : null}
          </div>

          <ul class="mt-3 space-y-1 text-xs text-espuma-600">
            <li>
              Tener tu barco: {textoRango(c.costeTener)} (solo las partidas con dato de la calculadora
              {c.amortizacion > 0 ? `, más ${euros(c.amortizacion)} de pérdida de valor` : ''}).
            </li>
            {c.combustible === null && (
              <li>El combustible no se ha sumado a ninguno de los dos lados porque falta el dato.</li>
            )}
            {desglose.sinDato.length > 0 && (
              <li>
                Faltan en el coste de tener barco: {desglose.sinDato.map((p) => p.nombre.toLowerCase()).join(', ')}.
              </li>
            )}
          </ul>
        </>
      )}

      <ul class="mt-4 space-y-1 text-sm">
        {MATICES_ALQUILER.map((m) => (
          <li key={m} class="flex gap-2">
            <span class="text-mar-500" aria-hidden="true">
              —
            </span>
            <span>{m}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
