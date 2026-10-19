/**
 * Datos legales aplicados al barco de la calculadora: titulación, seguro obligatorio,
 * inspección e impuestos de compra. Son DATOS LEGALES VERIFICADOS (no estimaciones):
 * se muestran como información firme, cada uno con enlace a su fuente oficial.
 */
import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { TIPOS_BARCO } from '../data/tiposBarco';
import { LISTA_TITULACIONES, esloraMaximaPara } from '../data/titulaciones';
import { SEGURO_LEGAL, seguroObligatorio } from '../data/seguro';
import {
  ENTIDADES_COLABORADORAS,
  FUENTES_INSPECCION,
  INTERMEDIA,
  MARCADO_CE,
  necesitaIntermedia,
  periodicidadPara,
} from '../data/inspeccion';
import { EXENCION_CHARTER, IEDMT, IVA_NUEVA, REGISTRO, importeIEDMT } from '../data/impuestos';
import type { EntradasCalculo } from '../lib/calculoCostes';
import { euros, num } from '../lib/formato';
import FuenteDato from './FuenteDato';
import Insignia from './Insignia';

function Bloque({ titulo, children }: { titulo: string; children: ComponentChildren }) {
  return (
    <div class="rounded-xl border border-espuma-200 bg-white p-4 sm:p-5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-lg font-bold">{titulo}</h3>
        <Insignia tipo="legal" />
      </div>
      <div class="mt-3 space-y-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

const EnTuCaso = ({ children }: { children: ComponentChildren }) => (
  <p class="rounded-lg bg-mar-50 px-3 py-2 font-semibold text-mar-900">{children}</p>
);

export default function DatosLegales({ entradas }: { entradas: EntradasCalculo }) {
  const [nueva, setNueva] = useState(false);
  const [charter, setCharter] = useState(false);
  const [madera, setMadera] = useState(false);

  const tipo = TIPOS_BARCO[entradas.tipo];
  const eslora = entradas.eslora;

  // Titulación: la de menor nivel cuya eslora máxima cubre la del barco (según su propulsión).
  const titulacion = LISTA_TITULACIONES.find((t) => {
    const max = esloraMaximaPara(t, tipo.propulsion);
    return max !== null && max >= eslora;
  });
  const sinTituloPorPotencia = titulacion?.id === 'ninguna' && tipo.propulsion === 'motor';

  // Seguro obligatorio
  const conMotor = entradas.motor === null ? null : entradas.motor !== 'ninguno';
  const obligatorio =
    conMotor === null
      ? eslora > SEGURO_LEGAL.esloraObligatoriaSinMotor
        ? true
        : null
      : seguroObligatorio(conMotor, eslora);

  // Inspección
  const regla = periodicidadPara(entradas.lista, eslora);
  const intermedia = necesitaIntermedia(eslora, madera);

  // Impuestos
  const iedmt = !charter && entradas.valor ? importeIEDMT(entradas.valor, eslora) : null;
  const iva = nueva && entradas.valor ? entradas.valor * IVA_NUEVA.tipo : null;

  return (
    <section class="tarjeta lg:col-start-1" aria-labelledby="titulo-legal">
      <p class="eyebrow">Normativa</p>
      <h2 id="titulo-legal" class="mt-1 text-xl font-bold">
        Datos legales para tu barco
      </h2>
      <p class="mt-1 text-sm text-espuma-600">
        Información de la normativa oficial aplicada a un {tipo.nombre.toLowerCase()} de {num(eslora)} m. No son
        estimaciones.
      </p>

      <div class="mt-5 space-y-4">
        <Bloque titulo="Titulación necesaria">
          {titulacion ? (
            <EnTuCaso>
              Para {num(eslora)} m ({tipo.propulsion}):{' '}
              <a href={`/titulaciones/${titulacion.slug}/`} class="underline underline-offset-2">
                {titulacion.nombre}
              </a>
              {sinTituloPorPotencia && ` (si el motor es de ${num(titulacion.potenciaMaximaKw ?? 0, 2)} kW o menos)`}.
            </EnTuCaso>
          ) : (
            <EnTuCaso>Sin dato verificado para esta eslora: consulta el Real Decreto 875/2014.</EnTuCaso>
          )}
          {tipo.id === 'moto-agua' && <p>La Licencia de Navegación habilita para gobernar motos náuticas.</p>}
          <FuenteDato fuentes={titulacion ? titulacion.fuentes : ['rd875']} />
        </Bloque>

        <Bloque titulo="Seguro obligatorio">
          <p>{SEGURO_LEGAL.texto}</p>
          <EnTuCaso>
            {obligatorio === true && 'Para tu barco es obligatorio el seguro de responsabilidad civil.'}
            {obligatorio === false && 'Para tu barco no es obligatorio por ley (sin motor y de 6 m o menos).'}
            {obligatorio === null && 'Depende: es obligatorio si tu barco tiene motor. Elige el tipo de motor arriba.'}
          </EnTuCaso>
          <FuenteDato fuentes={SEGURO_LEGAL.fuentes} />
        </Bloque>

        <Bloque titulo="Inspección (reconocimientos)">
          <EnTuCaso>
            Lista {entradas.lista}.ª, {num(eslora)} m:{' '}
            {regla ? regla.texto.toLowerCase() : 'combinación no incluida en la tabla oficial; consulta la fuente'}.
          </EnTuCaso>
          <label class="flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              class="size-5 accent-mar-700"
              checked={madera}
              onChange={(e) => setMadera(e.currentTarget.checked)}
            />
            El casco es de madera
          </label>
          {intermedia && <p>{INTERMEDIA.texto}</p>}
          {eslora <= MARCADO_CE.esloraMaxima && <p>{MARCADO_CE.texto}</p>}
          <p>Entidades colaboradoras: {ENTIDADES_COLABORADORAS.join(', ')}.</p>
          <p>
            <strong>Precio:</strong> cada entidad fija el suyo. Pide presupuesto a una entidad colaboradora de tu zona.
          </p>
          <FuenteDato fuentes={FUENTES_INSPECCION} />
        </Bloque>

        <Bloque titulo="Impuestos y registro al comprar (pago único)">
          <div class="flex flex-wrap gap-x-6 gap-y-1">
            <label class="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                class="size-5 accent-mar-700"
                checked={nueva}
                onChange={(e) => setNueva(e.currentTarget.checked)}
              />
              Es una embarcación nueva
            </label>
            <label class="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                class="size-5 accent-mar-700"
                checked={charter}
                onChange={(e) => setCharter(e.currentTarget.checked)}
              />
              Será para chárter (no uso privado)
            </label>
          </div>
          <p>
            {IEDMT.texto} {IEDMT.textoExentas}
          </p>
          <EnTuCaso>
            {charter
              ? eslora <= EXENCION_CHARTER.esloraMaxima
                ? `${EXENCION_CHARTER.texto} Revisa los requisitos en la fuente.`
                : 'El IEDMT se aplica a las embarcaciones de uso privado; para chárter de más de 15 m consulta la fuente.'
              : eslora > IEDMT.esloraMayorQue
                ? iedmt !== null
                  ? `IEDMT: 12 % de ${euros(entradas.valor!)} = ${euros(iedmt)}.`
                  : 'IEDMT: 12 % del valor (indica el valor del barco para calcularlo).'
                : 'IEDMT: exenta por medir 8 m o menos (pero se declara).'}
          </EnTuCaso>
          {nueva && (
            <EnTuCaso>
              {iva !== null ? `IVA (21 %) de ${euros(entradas.valor!)} = ${euros(iva)}.` : IVA_NUEVA.texto}
            </EnTuCaso>
          )}
          {eslora >= REGISTRO.esloraMinima && <p>{REGISTRO.texto}</p>}
          <p class="text-espuma-600">
            No incluido: el impuesto de transmisiones (ITP) de las compras de segunda mano; depende de cada comunidad
            autónoma y no tenemos dato verificado.
          </p>
          <FuenteDato fuentes={[...IEDMT.fuentes, ...REGISTRO.fuentes]} />
        </Bloque>
      </div>
    </section>
  );
}
