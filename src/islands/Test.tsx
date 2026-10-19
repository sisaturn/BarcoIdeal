/**
 * Test "¿Qué barco me conviene?": cuestionario paso a paso y resultado.
 * Las preguntas están en src/data/preguntas.ts y la lógica en src/data/recomendador.ts.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';
import { PREGUNTAS, DIAS_POR_RESPUESTA, etiquetaRespuesta, type Respuestas } from '../data/preguntas';
import { MAX_MOTIVOS_A_FAVOR, notasPara, nivelEncaje, recomendar, type Recomendacion } from '../data/recomendador';
import { TITULACIONES, AVISO_TITULACIONES } from '../data/titulaciones';
import { AVISO_COSTES } from '../data/costes';
import {
  borrarTest,
  guardarTest,
  leerTest,
  queryTest,
  respuestasDesdeURL,
  testCompleto,
  urlCalculadora,
  type EstadoTest,
} from '../lib/estado';
import { num } from '../lib/formato';
import { textoRango } from '../lib/calculoCostes';
import { notaTitulacion } from '../lib/fichas';
import Aviso from './Aviso';
import IconoBarco from './IconoBarco';

const TOTAL = PREGUNTAS.length;
/** Paso especial que muestra el resultado. */
const RESULTADO = TOTAL;

export default function Test() {
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [guardado, setGuardado] = useState<EstadoTest | null>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const haInteractuado = useRef(false);
  const avanceRef = useRef<number | undefined>(undefined);

  // Al cargar: si la URL trae un resultado completo, lo mostramos; si no, ofrecemos el último guardado.
  useEffect(() => {
    const desdeURL = respuestasDesdeURL(window.location.search);
    if (testCompleto(desdeURL)) {
      setRespuestas(desdeURL);
      setPaso(RESULTADO);
      return;
    }
    const previo = leerTest();
    if (previo && testCompleto(previo.respuestas)) setGuardado(previo);
  }, []);

  // Al cambiar de paso, llevamos el foco al título (lectores de pantalla y teclado).
  useEffect(() => {
    if (!haInteractuado.current) return;
    tituloRef.current?.focus();
    tituloRef.current?.scrollIntoView({ block: 'nearest' });
  }, [paso]);

  useEffect(() => () => window.clearTimeout(avanceRef.current), []);

  const irA = (nuevoPaso: number) => {
    haInteractuado.current = true;
    window.clearTimeout(avanceRef.current);
    setPaso(nuevoPaso);
  };

  const responder = (valor: string, conRaton: boolean) => {
    const pregunta = PREGUNTAS[paso];
    const nuevas = { ...respuestas, [pregunta.id]: valor };
    setRespuestas(nuevas);
    // Con ratón o dedo avanzamos solos tras un instante; con teclado se usa el botón "Siguiente"
    // (si no, las flechas del teclado saltarían de pregunta al recorrer las opciones).
    if (conRaton) {
      window.clearTimeout(avanceRef.current);
      avanceRef.current = window.setTimeout(() => irA(paso + 1), 280);
    }
  };

  const reiniciar = () => {
    borrarTest();
    setRespuestas({});
    setGuardado(null);
    history.replaceState(null, '', window.location.pathname);
    irA(0);
  };

  const verGuardado = () => {
    if (!guardado) return;
    setRespuestas(guardado.respuestas);
    irA(RESULTADO);
  };

  if (paso >= RESULTADO && testCompleto(respuestas)) {
    return <Resultado respuestas={respuestas} tituloRef={tituloRef} onCambiar={() => irA(0)} onReiniciar={reiniciar} />;
  }

  const pregunta = PREGUNTAS[Math.min(paso, TOTAL - 1)];
  const seleccion = respuestas[pregunta.id];
  const porcentaje = Math.round(((paso + (seleccion ? 1 : 0)) / TOTAL) * 100);

  return (
    <div class="mx-auto max-w-2xl">
      {guardado && paso === 0 && !respuestas.uso && (
        <div class="mb-6 flex flex-col gap-3 rounded-xl border border-mar-200 bg-mar-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-mar-900">
            Ya hiciste el test el {new Date(guardado.fecha).toLocaleDateString('es-ES')}.
          </p>
          <button type="button" class="btn-secundario min-h-10 px-4 py-1.5 text-sm" onClick={verGuardado}>
            Ver mi último resultado
          </button>
        </div>
      )}

      {/* Progreso */}
      <div class="mb-6">
        <div class="mb-2 flex items-center justify-between text-sm font-semibold text-mar-800">
          <span>
            Pregunta {paso + 1} de {TOTAL}
          </span>
          <span aria-hidden="true">{porcentaje} %</span>
        </div>
        <div
          class="h-2.5 overflow-hidden rounded-full bg-espuma-200"
          role="progressbar"
          aria-label="Progreso del test"
          aria-valuemin={0}
          aria-valuemax={TOTAL}
          aria-valuenow={paso + 1}
          aria-valuetext={`Pregunta ${paso + 1} de ${TOTAL}`}
        >
          <div
            class="h-full w-0 rounded-full bg-mar-600 transition-[width] duration-300"
            // Sin style en el HTML inicial (CSP); al avanzar, Preact fija el ancho desde JavaScript.
            style={porcentaje > 0 ? { width: `${porcentaje}%` } : undefined}
          />
        </div>
      </div>

      <form
        class="tarjeta"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (seleccion) irA(paso + 1);
        }}
      >
        <fieldset>
          <legend class="contents">
            <h2 ref={tituloRef} tabIndex={-1} class="text-2xl font-extrabold outline-none sm:text-3xl">
              {pregunta.titulo}
            </h2>
          </legend>
          {pregunta.ayuda && <p class="mt-2 text-espuma-600">{pregunta.ayuda}</p>}

          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            {pregunta.opciones.map((o) => {
              const id = `p-${pregunta.id}-${o.valor}`;
              return (
                <div key={id}>
                  <input
                    type="radio"
                    id={id}
                    name={pregunta.id}
                    value={o.valor}
                    checked={seleccion === o.valor}
                    class="peer sr-only"
                    onChange={() => responder(o.valor, false)}
                  />
                  {/* detail > 0 solo en clics reales de ratón o dedo (no con teclado). */}
                  <label
                    for={id}
                    onClick={(ev) => ev.detail > 0 && responder(o.valor, true)}
                    class="flex h-full min-h-14 cursor-pointer items-start gap-3 rounded-xl border-2 border-espuma-200 bg-white p-4 transition-colors hover:border-mar-300 hover:bg-mar-50 peer-checked:border-mar-600 peer-checked:bg-mar-50 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-baliza-500"
                  >
                    <span
                      class={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        seleccion === o.valor ? 'border-mar-600' : 'border-espuma-300'
                      }`}
                      aria-hidden="true"
                    >
                      {seleccion === o.valor && <span class="size-2.5 rounded-full bg-mar-600" />}
                    </span>
                    <span>
                      <span class="block font-semibold text-mar-950">{o.etiqueta}</span>
                      {o.detalle && <span class="mt-0.5 block text-sm text-espuma-600">{o.detalle}</span>}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>

        <div class="mt-6 flex items-center justify-between gap-3 border-t border-espuma-200 pt-5">
          <button
            type="button"
            class="btn-texto disabled:invisible"
            disabled={paso === 0}
            onClick={() => irA(paso - 1)}
          >
            <span aria-hidden="true">←</span> Anterior
          </button>
          <button type="submit" class="btn-primario" disabled={!seleccion}>
            {paso === TOTAL - 1 ? 'Ver mi resultado' : 'Siguiente'} <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------------

interface PropsResultado {
  respuestas: Respuestas;
  tituloRef: RefObject<HTMLHeadingElement | null>;
  onCambiar: () => void;
  onReiniciar: () => void;
}

function Resultado({ respuestas, tituloRef, onCambiar, onReiniciar }: PropsResultado) {
  const recomendaciones = useMemo(() => recomendar(respuestas), [respuestas]);
  const notas = useMemo(() => notasPara(respuestas), [respuestas]);
  const [mensaje, setMensaje] = useState('');
  const [enlaceManual, setEnlaceManual] = useState('');

  // Guardamos el resultado (para el formulario de ayuda) y lo reflejamos en la URL.
  useEffect(() => {
    guardarTest({ respuestas, recomendados: recomendaciones.map((r) => r.tipo.id) });
    history.replaceState(null, '', `${window.location.pathname}?${queryTest(respuestas)}`);
  }, [respuestas, recomendaciones]);

  const compartir = async () => {
    const url = `${window.location.origin}${window.location.pathname}?${queryTest(respuestas)}`;
    const nombres = recomendaciones.map((r) => r.tipo.nombre.toLowerCase()).join(', ');
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mi barco ideal', text: `Según el test, me encajan: ${nombres}.`, url });
        return;
      } catch (e) {
        if ((e as DOMException).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setMensaje('Enlace copiado. Pégalo donde quieras compartirlo.');
    } catch {
      setEnlaceManual(url);
      setMensaje('Copia este enlace para compartir tu resultado:');
    }
  };

  const dias = respuestas.dias ? DIAS_POR_RESPUESTA[respuestas.dias] : undefined;

  return (
    <div>
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-sm font-bold tracking-wide text-baliza-700 uppercase">Tu resultado</p>
          <h2 ref={tituloRef} tabIndex={-1} class="mt-1 text-3xl font-extrabold outline-none sm:text-4xl">
            {recomendaciones.length === 3 ? 'Estos 3 tipos de barco' : 'Estos 2 tipos de barco'} encajan contigo
          </h2>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secundario" onClick={compartir}>
            <IconoCompartir /> Compartir resultado
          </button>
          <button type="button" class="btn-texto" onClick={onReiniciar}>
            Reiniciar el test
          </button>
        </div>
      </div>

      <div role="status" aria-live="polite" class="mt-3 text-sm font-semibold text-mar-800">
        {mensaje}
        {enlaceManual && (
          <input
            type="text"
            readOnly
            value={enlaceManual}
            class="campo mt-2 text-sm"
            aria-label="Enlace para compartir"
            onFocus={(ev) => (ev.currentTarget as HTMLInputElement).select()}
          />
        )}
      </div>

      {/* Resumen de respuestas */}
      <details class="mt-6 rounded-xl border border-espuma-200 bg-espuma-50 p-4">
        <summary class="cursor-pointer font-semibold text-mar-900">Tus respuestas</summary>
        <dl class="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {PREGUNTAS.map((p) => (
            <div key={p.id} class="flex justify-between gap-3 border-b border-espuma-200 py-1">
              <dt class="text-espuma-600">{p.corto}</dt>
              <dd class="text-right font-semibold text-mar-950">{etiquetaRespuesta(p.id, respuestas[p.id])}</dd>
            </div>
          ))}
        </dl>
        <button type="button" class="btn-texto mt-2" onClick={onCambiar}>
          Cambiar respuestas
        </button>
      </details>

      <ol class="mt-8 space-y-6">
        {recomendaciones.map((rec, i) => (
          <TarjetaRecomendacion key={rec.tipo.id} rec={rec} posicion={i + 1} dias={dias} />
        ))}
      </ol>

      {notas.length > 0 && (
        <section class="mt-8" aria-labelledby="titulo-notas">
          <h3 id="titulo-notas" class="text-xl font-bold">
            Antes de decidir
          </h3>
          <ul class="mt-3 space-y-2">
            {notas.map((n) => (
              <li key={n} class="flex gap-2">
                <span class="text-baliza-700" aria-hidden="true">
                  ●
                </span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Con pocos días de uso, alquilar suele compensar: enlazamos al comparador de la calculadora. */}
      {(respuestas.dias === '<15' || respuestas.dias === '15-40') && recomendaciones[0] && (
        <a
          href={`${urlCalculadora(recomendaciones[0].entradasCalculadora, dias)}#comprar-o-alquilar`}
          class="group mt-8 flex flex-col gap-2 rounded-2xl border-2 border-baliza-300 bg-baliza-50 p-5 transition-colors hover:border-baliza-400 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            <span class="block text-lg font-bold text-mar-950">¿Y si en vez de comprar, alquilas?</span>
            <span class="block text-sm text-espuma-700">
              Navegando {etiquetaRespuesta('dias', respuestas.dias).toLowerCase()} al año, compara con los precios de
              alquiler de tu zona antes de decidir.
            </span>
          </span>
          <span class="shrink-0 font-semibold text-mar-800 group-hover:underline">
            Comparar comprar o alquilar <span aria-hidden="true">→</span>
          </span>
        </a>
      )}

      <div class="mt-8 grid gap-3 md:grid-cols-2">
        <Aviso titulo="Cifras orientativas">{AVISO_COSTES}</Aviso>
        <Aviso titulo="Titulaciones" tono="info">
          {AVISO_TITULACIONES}
        </Aviso>
      </div>

      <div class="mt-10 flex flex-col items-start gap-4 rounded-2xl bg-mar-950 p-6 text-white sm:p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 class="text-xl font-bold text-white sm:text-2xl">¿Te ayudo a encontrarlo?</h3>
          <p class="mt-1 text-mar-100">
            Te envío 5 opciones reales en 48 horas. Tu resultado del test se adjunta automáticamente.
          </p>
        </div>
        <a href="/ayuda/" class="btn-primario shrink-0">
          Pedir ayuda personalizada
        </a>
      </div>
    </div>
  );
}

function TarjetaRecomendacion({ rec, posicion, dias }: { rec: Recomendacion; posicion: number; dias?: number }) {
  const { tipo } = rec;
  const encaje = nivelEncaje(rec);
  const colorEncaje =
    encaje.tono === 'alto'
      ? 'bg-mar-100 text-mar-900'
      : encaje.tono === 'medio'
        ? 'bg-espuma-100 text-espuma-700'
        : 'bg-baliza-100 text-baliza-800';
  const habitual = TITULACIONES[tipo.titulacionHabitual];
  const enlaceCalc = urlCalculadora(rec.entradasCalculadora, dias);
  const idTitulo = `rec-${tipo.id}`;

  return (
    <li class="tarjeta overflow-hidden p-0 sm:p-0" aria-labelledby={idTitulo}>
      <div class="flex flex-wrap items-center gap-3 border-b border-espuma-200 bg-espuma-50 px-5 py-4 sm:px-6">
        <span
          class="flex size-9 items-center justify-center rounded-full bg-mar-700 font-extrabold text-white"
          aria-hidden="true"
        >
          {posicion}
        </span>
        <IconoBarco tipo={tipo.id} class="size-10 text-mar-700" />
        <h3 id={idTitulo} class="text-xl font-extrabold sm:text-2xl">
          <span class="sr-only">Opción {posicion}: </span>
          {tipo.nombre}
        </h3>
        {posicion === 1 && (
          <span class="rounded-full bg-baliza-400 px-3 py-0.5 text-xs font-bold text-mar-950">Mejor opción</span>
        )}
        <span class={`rounded-full px-3 py-0.5 text-xs font-bold ${colorEncaje}`}>{encaje.texto}</span>
      </div>

      <div class="space-y-5 p-5 sm:p-6">
        <p class="text-lg leading-relaxed">{tipo.descripcion}</p>

        {rec.aFavor.length > 0 && (
          <div>
            <h4 class="font-bold text-mar-950">Por qué encaja contigo</h4>
            <ul class="mt-2 space-y-1.5">
              {rec.aFavor.slice(0, MAX_MOTIVOS_A_FAVOR).map((t) => (
                <li key={t} class="flex gap-2">
                  <IconoCheck />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <dl class="grid gap-3 rounded-xl bg-mar-50 p-4 text-sm sm:grid-cols-3">
          <div>
            <dt class="text-mar-800">Eslora orientativa para ti</dt>
            <dd class="mt-0.5 text-lg font-bold text-mar-950">
              {num(rec.eslora.min)}–{num(rec.eslora.max)} m
            </dd>
          </div>
          <div>
            <dt class="text-mar-800">Titulación habitual</dt>
            <dd class="mt-0.5 text-lg font-bold text-mar-950">
              <a
                href={`/titulaciones/${habitual.slug}/`}
                class="underline decoration-mar-300 underline-offset-4 hover:decoration-mar-700"
              >
                {habitual.corto}
              </a>
            </dd>
          </div>
          <div>
            <dt class="text-mar-800">Coste anual orientativo</dt>
            <dd class="mt-0.5 text-lg font-bold text-mar-950">
              {rec.costeAnualEstimado ? textoRango(rec.costeAnualEstimado) : 'Sin dato'}
            </dd>
            <dd class="mt-0.5 text-xs text-mar-800">
              {rec.costeAnualEstimado
                ? `Estimación orientativa parcial: ${rec.costeIncluye.join(' y ')}. Faltan seguro, combustible e inspección.`
                : 'Sin dato orientativo para esta forma de guardarlo.'}
            </dd>
          </div>
        </dl>
        <ul class="-mt-2 text-sm text-espuma-600">
          {notaTitulacion(tipo).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>

        <div class="grid gap-5 md:grid-cols-2">
          <div>
            <h4 class="font-bold text-mar-950">Ventajas</h4>
            <ul class="mt-2 space-y-1.5">
              {tipo.ventajas.map((t) => (
                <li key={t} class="flex gap-2">
                  <span class="font-bold text-mar-600" aria-hidden="true">
                    +
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 class="font-bold text-mar-950">Inconvenientes</h4>
            <ul class="mt-2 space-y-1.5">
              {tipo.inconvenientes.map((t) => (
                <li key={t} class="flex gap-2">
                  <span class="font-bold text-baliza-700" aria-hidden="true">
                    −
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {(rec.enContra.length > 0 || rec.descartado) && (
          <div class="rounded-xl border border-baliza-200 bg-baliza-50 p-4">
            <h4 class="font-bold text-baliza-800">Ten en cuenta</h4>
            <ul class="mt-2 space-y-1.5 text-sm text-baliza-800">
              {rec.descartado && <li>{rec.descartado}</li>}
              {rec.enContra.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        <div class="flex flex-col gap-3 border-t border-espuma-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-wrap items-center gap-2">
            <a href={enlaceCalc} class="btn-primario">
              Calcular su coste anual<span class="sr-only"> ({tipo.nombre})</span> <span aria-hidden="true">→</span>
            </a>
            <a href={`/barcos/${tipo.id}/`} class="btn-texto">
              Ver ficha completa<span class="sr-only"> de {tipo.nombre}</span>
            </a>
          </div>
          <details class="text-sm">
            <summary class="cursor-pointer font-semibold text-mar-700">
              Cómo se ha calculado ({rec.puntos} puntos)
            </summary>
            <table class="mt-2 w-full min-w-64 text-left">
              <caption class="sr-only">Puntos de {tipo.nombre} según tus respuestas</caption>
              <tbody>
                {rec.detalle.map((d) => (
                  <tr key={d.origen} class="border-b border-espuma-200">
                    <th scope="row" class="py-1 pr-4 font-normal text-espuma-700">
                      {d.origen}
                    </th>
                    <td class={`py-1 text-right font-bold ${d.puntos > 0 ? 'text-mar-700' : 'text-baliza-700'}`}>
                      {d.puntos > 0 ? `+${d.puntos}` : `−${Math.abs(d.puntos)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      </div>
    </li>
  );
}

const IconoCheck = () => (
  <svg class="mt-1 size-4 shrink-0 text-mar-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      fill-rule="evenodd"
      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
      clip-rule="evenodd"
    />
  </svg>
);

const IconoCompartir = () => (
  <svg class="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.475l6.733-3.366A2.52 2.52 0 0 1 13 4.5Z" />
  </svg>
);
