/**
 * Calculadora de coste anual con RANGOS orientativos y huecos explícitos.
 * Datos: src/data (amarres, seguro, mantenimiento, inspeccion, impuestos). Fórmulas: src/lib/calculoCostes.ts.
 * Cada partida es una "estimación orientativa" editable; lo que no tiene dato verificado queda fuera del total.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { LISTA_TIPOS_BARCO, TIPOS_BARCO, esTipoBarco, type IdTipoBarco } from '../data/tiposBarco';
import {
  AVISO_COSTES,
  NO_INCLUIDO,
  TIPOS_AMARRE,
  ZONAS,
  type IdAmarre,
  type IdPartida,
  type IdZona,
} from '../data/costes';
import { AVISO_AMARRES, FUENTES_AMARRES, REMOLQUE } from '../data/amarres';
import { FUENTES_MANTENIMIENTO, COMBUSTIBLE } from '../data/mantenimiento';
import { FUENTES, type IdFuente } from '../data/fuentes';
import { DIAS_POR_RESPUESTA } from '../data/preguntas';
import {
  calcularDesglose,
  entradasPorDefecto,
  textoRango,
  LIMITES,
  type Ajustes,
  type Antiguedad,
  type EntradasCalculo,
  type ModoAmarre,
  type TipoMotor,
} from '../lib/calculoCostes';
import { entradasDesdeURL, guardarCalculadora, leerCalculadora, leerTest, urlCalculadora } from '../lib/estado';
import { num } from '../lib/formato';
import CampoNumero from './CampoNumero';
import GraficoRangos from './GraficoRangos';
import Aviso from './Aviso';
import ComparadorAlquiler from './ComparadorAlquiler';
import DatosLegales from './DatosLegales';
import FuenteDato from './FuenteDato';
import Insignia from './Insignia';

const TIPO_INICIAL: IdTipoBarco = 'lancha-open';

/** Grupo de opciones tipo "botón" accesible (radio). */
function Opciones<T extends string>(props: {
  nombre: string;
  leyenda: string;
  valor: T | null;
  opciones: { valor: T; texto: string }[];
  onCambio: (v: T) => void;
  ayuda?: ComponentChildren;
  columnas?: string;
}) {
  return (
    <fieldset>
      <legend class="etiqueta-campo">{props.leyenda}</legend>
      <div class={`grid gap-2 ${props.columnas ?? 'sm:grid-cols-3'}`}>
        {props.opciones.map((o) => (
          <div key={o.valor}>
            <input
              type="radio"
              id={`${props.nombre}-${o.valor}`}
              name={props.nombre}
              value={o.valor}
              checked={props.valor === o.valor}
              onChange={() => props.onCambio(o.valor)}
              class="peer sr-only"
            />
            <label
              for={`${props.nombre}-${o.valor}`}
              class="flex h-full min-h-11 cursor-pointer items-center justify-center rounded-lg border-2 border-espuma-200 px-3 py-2 text-center text-sm font-semibold text-mar-900 hover:border-mar-300 peer-checked:border-mar-600 peer-checked:bg-mar-50 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-baliza-500"
            >
              {o.texto}
            </label>
          </div>
        ))}
      </div>
      {props.ayuda && <div class="ayuda-campo">{props.ayuda}</div>}
    </fieldset>
  );
}

const Grupo = ({ titulo, children }: { titulo: string; children: ComponentChildren }) => (
  <div class="border-t border-espuma-200 pt-5 first:border-t-0 first:pt-0">
    <h3 class="mb-4 text-sm font-bold tracking-wide text-mar-800 uppercase">{titulo}</h3>
    <div class="grid gap-5 sm:grid-cols-2">{children}</div>
  </div>
);

export default function Calculadora() {
  const [entradas, setEntradas] = useState<EntradasCalculo>(() => entradasPorDefecto(TIPO_INICIAL));
  const [ajustes, setAjustes] = useState<Ajustes>({});
  const [diasUso, setDiasUso] = useState<number | undefined>(undefined);
  const [origen, setOrigen] = useState<'url' | 'guardado' | 'test' | null>(null);
  /** true cuando el usuario ha tocado algo: solo entonces se guarda (para no adjuntar al formulario una simple visita). */
  const [usado, setUsado] = useState(false);
  /** La barra fija del total (móvil) solo se muestra mientras el desglose está en pantalla. */
  const refDesglose = useRef<HTMLElement>(null);
  const [verBarra, setVerBarra] = useState(false);

  useEffect(() => {
    if (!refDesglose.current || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setVerBarra(e.isIntersecting));
    io.observe(refDesglose.current);
    return () => io.disconnect();
  }, []);

  // Al cargar: URL > última calculadora guardada > recomendación del test > valores por defecto.
  useEffect(() => {
    const desdeURL = entradasDesdeURL(window.location.search);
    if (desdeURL.entradas.tipo) {
      setEntradas(entradasPorDefecto(desdeURL.entradas.tipo, desdeURL.entradas));
      setDiasUso(desdeURL.diasUso);
      setOrigen('url');
      return;
    }
    const guardada = leerCalculadora();
    const test = leerTest();
    if (guardada) {
      setEntradas(guardada.entradas);
      setAjustes(guardada.ajustes);
      setDiasUso(guardada.diasUso);
      setOrigen('guardado');
    } else if (test && esTipoBarco(test.recomendados[0])) {
      const tipo = test.recomendados[0];
      const zona = test.respuestas.zona as IdZona | undefined;
      const guardado = test.respuestas.guardado as IdAmarre | undefined;
      const amarre = guardado && TIPOS_BARCO[tipo].guardado.includes(guardado) ? guardado : undefined;
      setEntradas(entradasPorDefecto(tipo, { ...(zona && { zona }), ...(amarre && { amarre }) }));
      setDiasUso(test.respuestas.dias ? DIAS_POR_RESPUESTA[test.respuestas.dias] : undefined);
      setOrigen('test');
    }
  }, []);

  const desglose = useMemo(() => calcularDesglose(entradas, ajustes), [entradas, ajustes]);

  // Guardamos en el navegador (para adjuntarlo al formulario de ayuda) y actualizamos la URL.
  useEffect(() => {
    if (!usado && origen === null) return;
    guardarCalculadora({ entradas, ajustes, diasUso, total: desglose.total });
    history.replaceState(null, '', urlCalculadora(entradas, diasUso) + window.location.hash);
  }, [entradas, ajustes, diasUso, desglose.total, usado, origen]);

  const tipo = TIPOS_BARCO[entradas.tipo];
  const amarreHabitual = tipo.guardado.includes(entradas.amarre);
  const hayAjustes = Object.keys(ajustes).length > 0;
  const enPuertoOSeca = entradas.amarre !== 'remolque';

  const cambiar = <K extends keyof EntradasCalculo>(clave: K, valor: EntradasCalculo[K]) => {
    setUsado(true);
    setEntradas((e) => ({ ...e, [clave]: valor }));
  };

  const cambiarTipo = (nuevo: IdTipoBarco) => {
    // Al cambiar de tipo se carga su eslora típica (se conserva la zona) y se borran los ajustes.
    setUsado(true);
    setEntradas((e) => entradasPorDefecto(nuevo, { zona: e.zona }));
    setAjustes({});
  };

  const ajustar = (id: IdPartida, valor: number | null) => {
    setUsado(true);
    setAjustes((a) => {
      if (valor === null) {
        const { [id]: _, ...resto } = a;
        return resto;
      }
      return { ...a, [id]: valor };
    });
  };

  const porDia =
    diasUso && diasUso > 0 ? { min: desglose.total.min / diasUso, max: desglose.total.max / diasUso } : null;
  const fuentesMercado: IdFuente[] = [...FUENTES_AMARRES, 'roams', 'mapfre', ...FUENTES_MANTENIMIENTO];

  return (
    <div>
      {origen === 'test' && (
        <p class="mb-6 rounded-xl border border-mar-200 bg-mar-50 p-4 text-sm text-mar-900">
          Hemos rellenado la calculadora con la primera recomendación de tu test. Cambia lo que quieras.
        </p>
      )}

      <Aviso titulo="Estimaciones orientativas" class="mb-8">
        {AVISO_COSTES}
      </Aviso>

      {/* En móvil el orden es: datos → resumen → desglose → legales → comparador. En escritorio el resumen va fijo a la derecha. */}
      <div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        {/* ------------------------------------------------ Datos del barco */}
        <section class="tarjeta space-y-6 lg:col-start-1" aria-labelledby="titulo-datos">
          <h2 id="titulo-datos" class="text-xl font-bold">
            Tu barco
          </h2>

          <Grupo titulo="El barco">
            <div class="sm:col-span-2">
              <label for="c-tipo" class="etiqueta-campo">
                Tipo de barco
              </label>
              <select
                id="c-tipo"
                class="campo"
                value={entradas.tipo}
                onChange={(ev) => cambiarTipo((ev.currentTarget as HTMLSelectElement).value as IdTipoBarco)}
              >
                {LISTA_TIPOS_BARCO.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label for="c-eslora" class="etiqueta-campo">
                Eslora
              </label>
              <CampoNumero
                id="c-eslora"
                valor={entradas.eslora}
                onCambio={(n) => n !== null && cambiar('eslora', n)}
                decimales={1}
                min={LIMITES.eslora.min}
                max={LIMITES.eslora.max}
                sufijo="m"
              />
            </div>
            <div>
              <label for="c-valor" class="etiqueta-campo">
                Valor del barco <span class="font-normal text-espuma-600">(opcional)</span>
              </label>
              <CampoNumero
                id="c-valor"
                valor={entradas.valor}
                onCambio={(n) => cambiar('valor', n)}
                min={0}
                max={LIMITES.valor.max}
                sufijo="€"
                placeholder="Para el seguro"
                describedBy="c-valor-ayuda"
              />
              <p id="c-valor-ayuda" class="ayuda-campo">
                Sirve para estimar el seguro y los impuestos.
              </p>
            </div>
            <div>
              <label for="c-zona" class="etiqueta-campo">
                Zona de navegación
              </label>
              <select
                id="c-zona"
                class="campo"
                value={entradas.zona}
                onChange={(ev) => cambiar('zona', (ev.currentTarget as HTMLSelectElement).value as IdZona)}
              >
                {(Object.keys(ZONAS) as IdZona[]).map((z) => (
                  <option key={z} value={z}>
                    {ZONAS[z].nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label for="c-antiguedad" class="etiqueta-campo">
                Antigüedad <span class="font-normal text-espuma-600">(opcional)</span>
              </label>
              <select
                id="c-antiguedad"
                class="campo"
                value={entradas.antiguedad ?? ''}
                onChange={(ev) => {
                  const v = (ev.currentTarget as HTMLSelectElement).value;
                  cambiar('antiguedad', v === '' ? null : (v as Antiguedad));
                }}
              >
                <option value="">Sin indicar</option>
                <option value="nuevo">Nuevo</option>
                <option value="5-15">De 5 a 15 años</option>
                <option value="otra">Otra</option>
              </select>
            </div>
          </Grupo>

          <Grupo titulo="Amarre">
            <div class="sm:col-span-2">
              <Opciones<IdAmarre>
                nombre="c-amarre"
                leyenda="Dónde lo guardas"
                valor={entradas.amarre}
                opciones={(Object.keys(TIPOS_AMARRE) as IdAmarre[]).map((a) => ({
                  valor: a,
                  texto: TIPOS_AMARRE[a].nombre,
                }))}
                onCambio={(a) => cambiar('amarre', a)}
                ayuda={
                  <>
                    {TIPOS_AMARRE[entradas.amarre].descripcion}
                    {entradas.amarre === 'remolque' && ` Dato disponible solo hasta ~${REMOLQUE.esloraMaxima} m.`}
                    {!amarreHabitual && (
                      <span class="mt-1 block font-semibold text-baliza-700">
                        Ojo: un barco de este tipo no suele guardarse así.
                      </span>
                    )}
                  </>
                }
              />
            </div>
            {enPuertoOSeca && (
              <div class="sm:col-span-2">
                <Opciones<ModoAmarre>
                  nombre="c-modo"
                  leyenda="¿Cómo te cobran el amarre?"
                  valor={entradas.modoAmarre}
                  opciones={[
                    { valor: 'rango', texto: 'No lo sé: rango orientativo' },
                    { valor: 'privada', texto: 'Marina privada: precio anual' },
                    { valor: 'publico', texto: 'Puerto público: por m² y día' },
                  ]}
                  onCambio={(m) => cambiar('modoAmarre', m)}
                  ayuda="Las marinas privadas dan un precio anual cerrado; los puertos públicos cobran por m² y día (eslora × manga) o por GT."
                />
              </div>
            )}
            {enPuertoOSeca && entradas.modoAmarre === 'privada' && (
              <div>
                <label for="c-precio-amarre" class="etiqueta-campo">
                  Tarifa anual de tu marina
                </label>
                <CampoNumero
                  id="c-precio-amarre"
                  valor={entradas.precioAmarreAnual}
                  onCambio={(n) => cambiar('precioAmarreAnual', n)}
                  max={LIMITES.precioAmarreAnual.max}
                  sufijo="€/año"
                />
              </div>
            )}
            {enPuertoOSeca && entradas.modoAmarre === 'publico' && (
              <>
                <div>
                  <label for="c-tarifa" class="etiqueta-campo">
                    Tarifa del puerto
                  </label>
                  <CampoNumero
                    id="c-tarifa"
                    valor={entradas.tarifaM2Dia}
                    onCambio={(n) => cambiar('tarifaM2Dia', n)}
                    decimales={2}
                    max={LIMITES.tarifaM2Dia.max}
                    sufijo="€/m²/día"
                    placeholder="Ej.: 0,17–0,30 en Euskadi"
                  />
                </div>
                <div>
                  <label for="c-manga" class="etiqueta-campo">
                    Manga del barco
                  </label>
                  <CampoNumero
                    id="c-manga"
                    valor={entradas.manga}
                    onCambio={(n) => cambiar('manga', n)}
                    decimales={1}
                    min={LIMITES.manga.min}
                    max={LIMITES.manga.max}
                    sufijo="m"
                  />
                </div>
              </>
            )}
            {enPuertoOSeca && (
              <label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  class="size-5 accent-mar-700"
                  checked={entradas.ivaAmarre}
                  onChange={(e) => cambiar('ivaAmarre', e.currentTarget.checked)}
                />
                Sumar el IVA (21 %) al amarre
              </label>
            )}
          </Grupo>

          <Grupo titulo="Motor y combustible">
            <div>
              <label for="c-motor" class="etiqueta-campo">
                Tipo de motor
              </label>
              <select
                id="c-motor"
                class="campo"
                value={entradas.motor ?? ''}
                onChange={(ev) => {
                  const v = (ev.currentTarget as HTMLSelectElement).value;
                  cambiar('motor', v === '' ? null : (v as TipoMotor));
                }}
              >
                <option value="">Elige…</option>
                <option value="fueraborda">Fueraborda</option>
                <option value="intraborda">Intraborda</option>
                <option value="ninguno">Sin motor</option>
              </select>
            </div>
            <div>
              <label for="c-num-motores" class="etiqueta-campo">
                Número de motores
              </label>
              <select
                id="c-num-motores"
                class="campo"
                value={String(entradas.numMotores)}
                disabled={entradas.motor === 'ninguno'}
                onChange={(ev) => cambiar('numMotores', Number((ev.currentTarget as HTMLSelectElement).value))}
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
            {entradas.motor !== 'ninguno' && (
              <>
                <div>
                  <label for="c-horas" class="etiqueta-campo">
                    Horas de motor al año
                  </label>
                  <CampoNumero
                    id="c-horas"
                    valor={entradas.horasMotor}
                    onCambio={(n) => cambiar('horasMotor', n)}
                    max={LIMITES.horasMotor.max}
                    sufijo="h"
                  />
                </div>
                <div>
                  <label for="c-consumo" class="etiqueta-campo">
                    Consumo
                  </label>
                  <CampoNumero
                    id="c-consumo"
                    valor={entradas.consumoLitrosHora}
                    onCambio={(n) => cambiar('consumoLitrosHora', n)}
                    decimales={1}
                    max={LIMITES.consumo.max}
                    sufijo="l/h"
                    placeholder="Ficha del motor"
                  />
                </div>
                <div>
                  <label for="c-combustible" class="etiqueta-campo">
                    Combustible
                  </label>
                  <select
                    id="c-combustible"
                    class="campo"
                    value={entradas.combustible}
                    onChange={(ev) => {
                      const v = (ev.currentTarget as HTMLSelectElement).value as 'gasolina' | 'gasoleo';
                      setUsado(true);
                      setEntradas((e) => ({ ...e, combustible: v, precioLitro: COMBUSTIBLE[v].eurosLitro }));
                    }}
                  >
                    <option value="gasolina">Gasolina</option>
                    <option value="gasoleo">Gasóleo</option>
                  </select>
                </div>
                <div>
                  <label for="c-precio-litro" class="etiqueta-campo">
                    Precio del litro
                  </label>
                  <CampoNumero
                    id="c-precio-litro"
                    valor={entradas.precioLitro}
                    onCambio={(n) => cambiar('precioLitro', n)}
                    decimales={2}
                    max={LIMITES.precioLitro.max}
                    sufijo="€/l"
                    placeholder="Precio en tu puerto"
                    describedBy="c-precio-litro-ayuda"
                  />
                  <p id="c-precio-litro-ayuda" class="ayuda-campo">
                    {entradas.combustible === 'gasolina'
                      ? 'Gasolina marina: ~1,60 €/l orientativo. Compruébalo en tu puerto.'
                      : 'Sin precio orientativo de gasóleo: consulta la gasolinera de tu puerto.'}
                  </p>
                </div>
              </>
            )}
          </Grupo>

          <Grupo titulo="Mantenimiento e inspección">
            {entradas.amarre === 'puerto' && (
              <div class="sm:col-span-2">
                <Opciones<'profesional' | 'diy'>
                  nombre="c-antifouling"
                  leyenda="Antifouling"
                  valor={entradas.antifouling}
                  opciones={[
                    { valor: 'profesional', texto: 'Por un profesional' },
                    { valor: 'diy', texto: 'Lo hago yo' },
                  ]}
                  onCambio={(v) => cambiar('antifouling', v)}
                  columnas="grid-cols-2"
                />
              </div>
            )}
            <label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm sm:col-span-2">
              <input
                type="checkbox"
                class="size-5 accent-mar-700"
                checked={entradas.incluirVarada}
                onChange={(e) => cambiar('incluirVarada', e.currentTarget.checked)}
              />
              Incluir unos 2 meses en seco (varada)
            </label>
            <div class="sm:col-span-2">
              <Opciones<'7' | '6'>
                nombre="c-lista"
                leyenda="Lista de registro del barco"
                valor={String(entradas.lista) as '7' | '6'}
                opciones={[
                  { valor: '7', texto: 'Lista 7.ª' },
                  { valor: '6', texto: 'Lista 6.ª' },
                ]}
                onCambio={(v) => cambiar('lista', v === '6' ? 6 : 7)}
                columnas="grid-cols-2"
                ayuda="Consulta en qué lista está registrado tu barco: cambia la periodicidad de las inspecciones."
              />
            </div>
            <div class="sm:col-span-2">
              <label for="c-dias" class="etiqueta-campo">
                Días de uso al año <span class="font-normal text-espuma-600">(opcional)</span>
              </label>
              <CampoNumero
                id="c-dias"
                valor={diasUso ?? null}
                onCambio={(n) => {
                  setUsado(true);
                  setDiasUso(n && n > 0 ? n : undefined);
                }}
                min={0}
                max={365}
                sufijo="días"
                class="sm:max-w-56"
              />
            </div>
          </Grupo>
        </section>

        {/* ------------------------------------------------ Resumen (fijo en escritorio) */}
        <aside
          class="space-y-5 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-5 lg:row-start-1"
          aria-labelledby="titulo-resumen"
        >
          <div class="rounded-2xl bg-mar-950 p-6 text-white">
            <div class="flex items-start justify-between gap-3">
              <h2 id="titulo-resumen" class="text-sm font-bold tracking-wide text-mar-200 uppercase">
                Coste anual · {tipo.nombre}, {num(entradas.eslora)} m
              </h2>
              <Insignia tipo="mercado" />
            </div>
            <p class="mt-3 text-3xl leading-tight font-extrabold sm:text-4xl" aria-live="polite">
              {textoRango(desglose.total)}
              <span class="ml-1 text-base font-semibold text-mar-200">/año</span>
            </p>
            <dl class="mt-4 grid grid-cols-2 gap-4 border-t border-white/15 pt-4">
              <div>
                <dt class="text-sm text-mar-200">Al mes</dt>
                <dd class="text-lg font-bold">{textoRango(desglose.mensual)}</dd>
              </div>
              <div>
                <dt class="text-sm text-mar-200">Por día de uso</dt>
                <dd class="text-lg font-bold">{porDia ? textoRango(porDia) : '—'}</dd>
              </div>
            </dl>
            {desglose.sinDato.length > 0 && (
              <p class="mt-4 rounded-lg bg-white/10 p-3 text-sm text-mar-100">
                <strong class="text-white">No incluido por falta de dato:</strong>{' '}
                {desglose.sinDato.map((p) => p.nombre.toLowerCase()).join(', ')}. Escribe tus cifras en el desglose.
              </p>
            )}
            {desglose.reglaSector && (
              <p class="mt-3 text-sm text-mar-100">
                <strong class="text-white">Contraste:</strong> según la regla del sector, amarre + seguro +
                mantenimiento suelen sumar {textoRango(desglose.reglaSector)} al año para un barco de este valor y
                antigüedad.
              </p>
            )}
          </div>

          <div class="tarjeta">
            <GraficoRangos
              titulo="Partidas con dato"
              datos={desglose.partidas
                .filter((p) => p.valor !== null)
                .map((p) => ({ id: p.id, etiqueta: p.nombre, rango: p.valor! }))}
            />
          </div>

          <div class="tarjeta">
            <h2 class="text-lg font-bold">¿Buscas uno así?</h2>
            <p class="mt-1 text-sm">
              Te envío 5 opciones en 48 horas. Este cálculo se adjunta automáticamente al formulario.
            </p>
            <a href="/ayuda/" class="btn-primario mt-4 w-full">
              Pedir ayuda personalizada
            </a>
          </div>
        </aside>

        {/* ------------------------------------------------ Desglose editable */}
        <section ref={refDesglose} class="tarjeta lg:col-start-1" aria-labelledby="titulo-desglose">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="titulo-desglose" class="text-xl font-bold">
              Desglose anual
            </h2>
            {hayAjustes && (
              <button type="button" class="btn-texto text-sm" onClick={() => setAjustes({})}>
                Volver a todas las estimaciones
              </button>
            )}
          </div>
          <p class="mt-1 text-sm text-espuma-600">
            Cada partida es una estimación orientativa. Si tienes un presupuesto real, escríbelo en su casilla.
          </p>

          <ul class="mt-5 divide-y divide-espuma-200">
            {desglose.partidas.map((p) => (
              <li key={p.id} class="grid gap-3 py-4 sm:grid-cols-[1fr_12rem] sm:items-start">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <label for={`c-partida-${p.id}`} class="font-semibold text-mar-950">
                      {p.nombre}
                    </label>
                    <Insignia tipo={p.editado ? 'usuario' : p.estimado ? 'mercado' : 'sinDato'} />
                  </div>
                  <p class="mt-0.5 text-sm text-espuma-600">{p.ayuda}</p>
                  <p class="mt-1 text-xs text-espuma-600">
                    {p.estimado && <strong class="text-espuma-700">Estimación: {textoRango(p.estimado)}. </strong>}
                    {p.explicacion}
                    {p.fuentes.length > 0 &&
                      ` Fuente: ${[...new Set(p.fuentes)].map((f) => FUENTES[f].editor).join(', ')}.`}
                  </p>
                  {p.sinDato && <p class="mt-1 text-xs font-semibold text-baliza-700">{p.sinDato}</p>}
                </div>
                <div>
                  <CampoNumero
                    id={`c-partida-${p.id}`}
                    valor={p.editado ? p.valor!.min : null}
                    onCambio={(n) => ajustar(p.id, n)}
                    max={1_000_000}
                    sufijo="€/año"
                    placeholder={p.estimado ? textoRango(p.estimado) : 'Tu cifra'}
                  />
                  {p.editado && (
                    <button
                      type="button"
                      class="mt-1 text-sm font-semibold text-mar-700 underline underline-offset-2 hover:text-mar-900"
                      onClick={() => ajustar(p.id, null)}
                    >
                      Volver a la estimación<span class="sr-only"> de {p.nombre}</span>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div class="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-t-2 border-mar-950 pt-4">
            <span class="text-lg font-bold text-mar-950">Total anual (partidas con dato)</span>
            <span class="text-lg font-extrabold text-mar-950 tabular-nums">{textoRango(desglose.total)}</span>
          </div>
          <p class="mt-4 text-xs text-espuma-600">{AVISO_AMARRES}</p>
          <FuenteDato fuentes={fuentesMercado} class="mt-3" />
        </section>

        <DatosLegales entradas={entradas} />

        <ComparadorAlquiler
          entradas={entradas}
          desglose={desglose}
          diasUso={diasUso}
          onDias={(n) => {
            setUsado(true);
            setDiasUso(n);
          }}
        />

        <section class="lg:col-start-1" aria-labelledby="titulo-no-incluido">
          <h2 id="titulo-no-incluido" class="text-lg font-bold">
            Qué no incluye este cálculo
          </h2>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
            {NO_INCLUIDO.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      </div>

      {/* Barra fija con el total en móvil, para verlo mientras se editan las partidas.
          Es decorativa (aria-hidden): el total ya está en el resumen y al final del desglose. */}
      <div
        aria-hidden="true"
        class={`fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-mar-950/95 px-4 py-3 text-white backdrop-blur transition-transform duration-200 lg:hidden ${
          verBarra ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div class="mx-auto flex max-w-6xl items-baseline justify-between gap-3">
          <span class="text-sm text-mar-200">Total orientativo</span>
          <span class="text-base font-extrabold tabular-nums">{textoRango(desglose.total)}/año</span>
        </div>
      </div>
    </div>
  );
}
