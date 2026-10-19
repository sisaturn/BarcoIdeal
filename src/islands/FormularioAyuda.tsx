/**
 * Formulario "Cuéntame qué buscas" → Formspree.
 * Si el usuario ha usado el test o la calculadora, esos datos se adjuntan (y puede quitarlos).
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { Fragment, type TargetedEvent } from 'preact';
import { FORMSPREE_ENDPOINT, SITE_NAME } from '../config';
import { PREGUNTAS } from '../data/preguntas';
import { LISTA_TIPOS_BARCO, TIPOS_BARCO, esTipoBarco } from '../data/tiposBarco';
import { ZONAS, esZona, type IdZona } from '../data/costes';
import { AYUDA } from '../data/textos';
import {
  guardarUltimoEnvio,
  leerCalculadora,
  leerTest,
  leerUltimoEnvio,
  type EstadoCalculadora,
  type EstadoTest,
} from '../lib/estado';
import { aTexto, lineasCalculadora, lineasTest, type LineaResumen } from '../lib/resumen';

const OPCIONES_PRESUPUESTO = [
  ...PREGUNTAS.find((p) => p.id === 'compra')!.opciones,
  { valor: 'nose', etiqueta: 'Aún no lo sé' },
];

const ENDPOINT_CONFIGURADO = /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(FORMSPREE_ENDPOINT);
const MAX_ENLACES = 10;

/**
 * Protecciones contra spam y abusos (además del campo trampa `_gotcha` y del filtro de Formspree):
 *  - límite de longitud de cada campo (también en el HTML con maxLength);
 *  - se eliminan caracteres de control e invisibles que podrían disfrazar texto en el email;
 *  - solo se aceptan enlaces http/https, sin usuario ni contraseña;
 *  - un envío hecho en menos de SEGUNDOS_MINIMOS desde que se abre la página se trata como bot;
 *  - tras un envío correcto hay que esperar MINUTOS_ENTRE_ENVIOS para mandar otro desde el mismo navegador.
 */
const LIMITES = { nombre: 80, email: 254, comentarios: 3000, enlaces: 2000 } as const;
const SEGUNDOS_MINIMOS = 3;
const MINUTOS_ENTRE_ENVIOS = 10;

// Caracteres de control (salvo salto de línea y tabulador) y marcas de dirección de texto invisibles.
const INVISIBLES = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g;

/** Limpia un texto antes de enviarlo: quita caracteres raros, recorta espacios y lo limita de longitud. */
function limpiar(texto: string, max: number): string {
  return texto.replace(INVISIBLES, '').trim().slice(0, max);
}

interface Campos {
  nombre: string;
  email: string;
  presupuesto: string;
  tipo: string;
  zona: string;
  comentarios: string;
  enlaces: string;
  privacidad: boolean;
}

type Errores = Partial<Record<keyof Campos, string>>;

const VACIO: Campos = {
  nombre: '',
  email: '',
  presupuesto: '',
  tipo: '',
  zona: '',
  comentarios: '',
  enlaces: '',
  privacidad: false,
};

/** Separa los enlaces por líneas, comas o espacios y se queda con los que parecen URL. */
function extraerEnlaces(texto: string): { validos: string[]; invalidos: string[] } {
  const trozos = texto
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const validos: string[] = [];
  const invalidos: string[] = [];
  for (const t of trozos) {
    // Cualquier esquema que no sea http/https (javascript:, data:, file:…) se rechaza.
    const tieneEsquema = /^[a-z][a-z0-9+.-]*:/i.test(t);
    if (tieneEsquema && !/^https?:\/\//i.test(t)) {
      invalidos.push(t);
      continue;
    }
    try {
      const url = new URL(tieneEsquema ? t : `https://${t}`);
      const valido =
        (url.protocol === 'https:' || url.protocol === 'http:') &&
        url.hostname.includes('.') &&
        !url.username &&
        !url.password;
      if (valido) validos.push(url.toString());
      else invalidos.push(t);
    } catch {
      invalidos.push(t);
    }
  }
  return { validos, invalidos };
}

function validar(c: Campos): Errores {
  const e: Errores = {};
  const nombre = limpiar(c.nombre, LIMITES.nombre);
  if (nombre.length < 2) e.nombre = 'Escribe tu nombre.';
  else if (/https?:|www\.|[<>]/i.test(nombre)) e.nombre = 'El nombre no puede contener enlaces ni los símbolos < >.';
  const email = c.email.trim();
  if (email.length > LIMITES.email || !/^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/.test(email))
    e.email = 'Escribe un email válido, por ejemplo nombre@correo.com.';
  if (!c.presupuesto) e.presupuesto = 'Elige un rango de presupuesto (o «Aún no lo sé»).';
  if (!c.tipo) e.tipo = 'Elige el tipo de barco que buscas (o «No lo tengo claro»).';
  if (!c.zona) e.zona = 'Elige la zona donde navegarás.';
  if (c.enlaces.trim()) {
    const { validos, invalidos } = extraerEnlaces(c.enlaces);
    if (invalidos.length) e.enlaces = `Esto no parece un enlace: ${invalidos.slice(0, 2).join(', ')}.`;
    else if (validos.length > MAX_ENLACES) e.enlaces = `Pega como máximo ${MAX_ENLACES} enlaces.`;
  }
  if (!c.privacidad) e.privacidad = 'Para enviar el formulario tienes que aceptar la política de privacidad.';
  return e;
}

export default function FormularioAyuda() {
  const [campos, setCampos] = useState<Campos>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [test, setTest] = useState<EstadoTest | null>(null);
  const [calc, setCalc] = useState<EstadoCalculadora | null>(null);
  const [adjuntarTest, setAdjuntarTest] = useState(true);
  const [adjuntarCalc, setAdjuntarCalc] = useState(true);
  const [estado, setEstado] = useState<'inicial' | 'enviando' | 'ok' | 'error'>('inicial');
  const [mensajeError, setMensajeError] = useState('');
  const refExito = useRef<HTMLDivElement>(null);
  const refForm = useRef<HTMLFormElement>(null);
  const abiertoEn = useRef(Date.now());

  // Rellenamos lo que ya sabemos por el test o la calculadora.
  useEffect(() => {
    abiertoEn.current = Date.now();
    const t = leerTest();
    const c = leerCalculadora();
    if (t?.respuestas) setTest(t);
    if (c?.entradas) setCalc(c);
    setCampos((prev) => {
      const tipo = t?.recomendados?.[0] ?? c?.entradas?.tipo ?? '';
      const zona = (t?.respuestas?.zona as IdZona | undefined) ?? c?.entradas?.zona ?? '';
      const presupuesto = t?.respuestas?.compra ?? '';
      return {
        ...prev,
        tipo: esTipoBarco(tipo) ? tipo : prev.tipo,
        zona: esZona(zona) ? zona : prev.zona,
        presupuesto: OPCIONES_PRESUPUESTO.some((o) => o.valor === presupuesto) ? presupuesto : prev.presupuesto,
      };
    });
  }, []);

  useEffect(() => {
    if (estado === 'ok') refExito.current?.focus();
  }, [estado]);

  const actualizar = <K extends keyof Campos>(clave: K, valor: Campos[K]) => {
    setCampos((c) => ({ ...c, [clave]: valor }));
    if (errores[clave]) setErrores((e) => ({ ...e, [clave]: undefined }));
  };

  const enviar = async (ev: TargetedEvent<HTMLFormElement, SubmitEvent>) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const nuevosErrores = validar(campos);
    setErrores(nuevosErrores);
    const primero = Object.keys(nuevosErrores)[0];
    if (primero) {
      form.querySelector<HTMLElement>(`[name="${primero}"]`)?.focus();
      return;
    }
    // Campo trampa para bots: si viene relleno, fingimos éxito y no enviamos nada.
    const trampa = (form.elements.namedItem('_gotcha') as HTMLInputElement | null)?.value;
    if (trampa) {
      setEstado('ok');
      return;
    }
    // Demasiado rápido para una persona: probablemente un bot. No se pierde nada: basta con volver a pulsar.
    if (Date.now() - abiertoEn.current < SEGUNDOS_MINIMOS * 1000) {
      setEstado('error');
      setMensajeError('Has ido muy rápido. Revisa los datos y vuelve a pulsar «Enviar solicitud».');
      abiertoEn.current = 0;
      return;
    }
    const ultimo = leerUltimoEnvio();
    if (ultimo && Date.now() - ultimo < MINUTOS_ENTRE_ENVIOS * 60_000) {
      setEstado('error');
      setMensajeError(
        `Ya enviaste una solicitud hace unos minutos. Si quieres añadir algo, espera ${MINUTOS_ENTRE_ENVIOS} minutos o escríbeme por email.`,
      );
      return;
    }
    if (!ENDPOINT_CONFIGURADO) {
      setEstado('error');
      setMensajeError(
        'El formulario todavía no está conectado (falta configurar FORMSPREE_ENDPOINT). Mientras tanto, escríbeme por email.',
      );
      return;
    }

    const tipoNombre = esTipoBarco(campos.tipo) ? TIPOS_BARCO[campos.tipo].nombre : 'No lo tiene claro';
    const nombre = limpiar(campos.nombre, LIMITES.nombre);
    const datos: Record<string, string> = {
      _subject: `[${SITE_NAME}] Nueva solicitud de ${nombre}`,
      nombre,
      email: limpiar(campos.email, LIMITES.email),
      presupuesto: OPCIONES_PRESUPUESTO.find((o) => o.valor === campos.presupuesto)?.etiqueta ?? campos.presupuesto,
      tipo_barco: tipoNombre,
      zona: esZona(campos.zona) ? ZONAS[campos.zona].nombre : '—',
      comentarios: limpiar(campos.comentarios, LIMITES.comentarios) || '—',
      enlaces_anuncios: extraerEnlaces(campos.enlaces).validos.join('\n') || '—',
      privacidad: 'Aceptada',
      test: test && adjuntarTest ? aTexto(lineasTest(test)) : 'No adjuntado',
      calculadora: calc && adjuntarCalc ? aTexto(lineasCalculadora(calc)) : 'No adjuntado',
    };

    setEstado('enviando');
    setMensajeError('');
    try {
      const resp = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (resp.ok) {
        guardarUltimoEnvio();
        setEstado('ok');
        return;
      }
      const json = (await resp.json().catch(() => null)) as { errors?: { message: string }[] } | null;
      throw new Error(json?.errors?.map((e) => e.message).join(' ') || `Error ${resp.status}`);
    } catch (e) {
      setEstado('error');
      setMensajeError(
        `No se ha podido enviar (${(e as Error).message}). Revisa tu conexión e inténtalo de nuevo en unos minutos.`,
      );
    }
  };

  if (estado === 'ok') {
    return (
      <div
        ref={refExito}
        tabIndex={-1}
        role="status"
        class="tarjeta border-mar-300 bg-mar-50 text-center outline-none sm:p-10"
      >
        <p class="text-4xl" aria-hidden="true">
          ⚓
        </p>
        <h2 class="mt-2 text-2xl font-extrabold">{AYUDA.exito.titulo}</h2>
        <p class="mx-auto mt-2 max-w-md text-lg">{AYUDA.exito.texto}</p>
        <a href="/" class="btn-secundario mt-6">
          Volver al inicio
        </a>
      </div>
    );
  }

  const idErr = (c: keyof Campos) => `f-${c}-error`;
  const attrsError = (c: keyof Campos, extra?: string) => ({
    'aria-invalid': errores[c] ? true : undefined,
    'aria-describedby': [extra, errores[c] ? idErr(c) : null].filter(Boolean).join(' ') || undefined,
  });
  const errorDe = (campo: keyof Campos) =>
    errores[campo] ? (
      <p id={idErr(campo)} class="mt-1 text-sm font-semibold text-baliza-700">
        {errores[campo]}
      </p>
    ) : null;
  const claseCampo = (c: keyof Campos) =>
    `campo ${errores[c] ? 'border-baliza-600 focus:border-baliza-600 focus:ring-baliza-200' : ''}`;
  const numErrores = Object.values(errores).filter(Boolean).length;

  return (
    <form ref={refForm} class="tarjeta space-y-6" noValidate onSubmit={enviar} aria-describedby="f-obligatorios">
      {!ENDPOINT_CONFIGURADO && (
        <p class="rounded-lg border border-dashed border-baliza-400 bg-baliza-50 p-3 text-sm text-baliza-800">
          <strong>Modo prototipo:</strong> falta configurar <code>FORMSPREE_ENDPOINT</code> (variable{' '}
          <code>PUBLIC_FORMSPREE_ENDPOINT</code>). El formulario se puede rellenar, pero no se enviará.
        </p>
      )}

      <p id="f-obligatorios" class="text-sm text-espuma-600">
        Los campos marcados con <span class="font-bold text-baliza-700">*</span> son obligatorios.
      </p>

      {numErrores > 0 && (
        <div
          role="alert"
          class="rounded-lg border border-baliza-300 bg-baliza-50 p-3 text-sm font-semibold text-baliza-800"
        >
          Revisa {numErrores === 1 ? 'el campo marcado' : `los ${numErrores} campos marcados`} antes de enviar.
        </div>
      )}

      <div class="grid gap-5 sm:grid-cols-2">
        <div>
          <label for="f-nombre" class="etiqueta-campo">
            Nombre <span class="text-baliza-700">*</span>
          </label>
          <input
            id="f-nombre"
            maxLength={LIMITES.nombre}
            name="nombre"
            type="text"
            autoComplete="given-name"
            required
            class={claseCampo('nombre')}
            value={campos.nombre}
            onInput={(e) => actualizar('nombre', e.currentTarget.value)}
            {...attrsError('nombre')}
          />
          {errorDe('nombre')}
        </div>

        <div>
          <label for="f-email" class="etiqueta-campo">
            Email <span class="text-baliza-700">*</span>
          </label>
          <input
            id="f-email"
            maxLength={LIMITES.email}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            class={claseCampo('email')}
            value={campos.email}
            onInput={(e) => actualizar('email', e.currentTarget.value)}
            {...attrsError('email', 'f-email-ayuda')}
          />
          <p id="f-email-ayuda" class="ayuda-campo">
            Solo lo usaré para enviarte las opciones.
          </p>
          {errorDe('email')}
        </div>

        <div>
          <label for="f-presupuesto" class="etiqueta-campo">
            Presupuesto de compra <span class="text-baliza-700">*</span>
          </label>
          <select
            id="f-presupuesto"
            name="presupuesto"
            required
            class={claseCampo('presupuesto')}
            value={campos.presupuesto}
            onChange={(e) => actualizar('presupuesto', e.currentTarget.value)}
            {...attrsError('presupuesto')}
          >
            <option value="">Elige un rango…</option>
            {OPCIONES_PRESUPUESTO.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.etiqueta}
              </option>
            ))}
          </select>
          {errorDe('presupuesto')}
        </div>

        <div>
          <label for="f-tipo" class="etiqueta-campo">
            Tipo de barco que buscas <span class="text-baliza-700">*</span>
          </label>
          <select
            id="f-tipo"
            name="tipo"
            required
            class={claseCampo('tipo')}
            value={campos.tipo}
            onChange={(e) => actualizar('tipo', e.currentTarget.value)}
            {...attrsError('tipo')}
          >
            <option value="">Elige un tipo…</option>
            {LISTA_TIPOS_BARCO.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
            <option value="nose">No lo tengo claro</option>
          </select>
          {errorDe('tipo')}
        </div>

        <div class="sm:col-span-2">
          <label for="f-zona" class="etiqueta-campo">
            Zona de navegación <span class="text-baliza-700">*</span>
          </label>
          <select
            id="f-zona"
            name="zona"
            required
            class={`${claseCampo('zona')} sm:max-w-sm`}
            value={campos.zona}
            onChange={(e) => actualizar('zona', e.currentTarget.value)}
            {...attrsError('zona')}
          >
            <option value="">Elige una zona…</option>
            {(Object.keys(ZONAS) as IdZona[]).map((z) => (
              <option key={z} value={z}>
                {ZONAS[z].nombre}
              </option>
            ))}
          </select>
          {errorDe('zona')}
        </div>

        <div class="sm:col-span-2">
          <label for="f-comentarios" class="etiqueta-campo">
            Comentarios
          </label>
          <textarea
            id="f-comentarios"
            name="comentarios"
            rows={4}
            maxLength={LIMITES.comentarios}
            class="campo"
            placeholder="Para qué lo quieres, con quién vas a navegar, si tienes amarre, qué no te gusta…"
            value={campos.comentarios}
            onInput={(e) => actualizar('comentarios', e.currentTarget.value)}
          />
        </div>

        <div class="sm:col-span-2">
          <label for="f-enlaces" class="etiqueta-campo">
            Enlaces a anuncios que ya te gusten <span class="font-normal text-espuma-600">(opcional)</span>
          </label>
          <textarea
            id="f-enlaces"
            maxLength={LIMITES.enlaces}
            name="enlaces"
            rows={3}
            class={claseCampo('enlaces')}
            placeholder={'https://…\nhttps://…'}
            value={campos.enlaces}
            onInput={(e) => actualizar('enlaces', e.currentTarget.value)}
            {...attrsError('enlaces', 'f-enlaces-ayuda')}
          />
          <p id="f-enlaces-ayuda" class="ayuda-campo">
            Uno por línea. Me ayudan a entender qué te gusta.
          </p>
          {errorDe('enlaces')}
        </div>
      </div>

      {(test || calc) && (
        <fieldset class="rounded-xl border border-mar-200 bg-mar-50 p-4">
          <legend class="px-1 text-sm font-bold text-mar-950">Datos que se adjuntarán</legend>
          <p class="text-sm text-mar-900">
            Has usado {test && calc ? 'el test y la calculadora' : test ? 'el test' : 'la calculadora'}. Adjuntarlo me
            ayuda a afinar la búsqueda; puedes quitarlo si prefieres.
          </p>
          <div class="mt-3 space-y-3">
            {test && (
              <Adjunto
                id="f-adj-test"
                titulo="Resultado del test"
                lineas={lineasTest(test)}
                marcado={adjuntarTest}
                onCambio={setAdjuntarTest}
              />
            )}
            {calc && (
              <Adjunto
                id="f-adj-calc"
                titulo="Cálculo de coste anual"
                lineas={lineasCalculadora(calc)}
                marcado={adjuntarCalc}
                onCambio={setAdjuntarCalc}
              />
            )}
          </div>
        </fieldset>
      )}

      {/* Campo trampa anti-spam de Formspree: invisible para personas */}
      <div class="hidden" aria-hidden="true">
        <label>
          No rellenes este campo
          <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <div class="flex items-start gap-3">
          <input
            id="f-privacidad"
            name="privacidad"
            type="checkbox"
            required
            class="mt-0.5 size-5 shrink-0 accent-mar-700"
            checked={campos.privacidad}
            onChange={(e) => actualizar('privacidad', e.currentTarget.checked)}
            {...attrsError('privacidad')}
          />
          <label for="f-privacidad" class="text-sm">
            He leído y acepto la{' '}
            <a href="/privacidad/" class="enlace" target="_blank" rel="noopener">
              política de privacidad
              <span class="sr-only"> (se abre en otra pestaña)</span>
            </a>
            . <span class="text-baliza-700">*</span>
          </label>
        </div>
        {errorDe('privacidad')}
      </div>

      {estado === 'error' && (
        <p
          role="alert"
          class="rounded-lg border border-baliza-300 bg-baliza-50 p-3 text-sm font-semibold text-baliza-800"
        >
          {mensajeError}
        </p>
      )}

      <div class="flex flex-col gap-3 border-t border-espuma-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-xs text-espuma-600">
          Responsable: el titular de esta web. Finalidad: responder a tu solicitud. Más información en la política de
          privacidad.
        </p>
        <button type="submit" class="btn-primario shrink-0" disabled={estado === 'enviando'}>
          {estado === 'enviando' ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </div>
    </form>
  );
}

function Adjunto(props: {
  id: string;
  titulo: string;
  lineas: LineaResumen[];
  marcado: boolean;
  onCambio: (v: boolean) => void;
}) {
  return (
    <div class="rounded-lg bg-white p-3">
      <div class="flex items-center gap-3">
        <input
          id={props.id}
          type="checkbox"
          class="size-5 accent-mar-700"
          checked={props.marcado}
          onChange={(e) => props.onCambio(e.currentTarget.checked)}
        />
        <label for={props.id} class="font-semibold text-mar-950">
          Adjuntar {props.titulo.toLowerCase()}
        </label>
      </div>
      <details class="mt-2 pl-8 text-sm">
        <summary class="cursor-pointer text-mar-700">Ver qué se envía</summary>
        <dl class="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
          {props.lineas.map((l) => (
            <Fragment key={l.etiqueta}>
              <dt class="text-espuma-600">{l.etiqueta}</dt>
              <dd class="font-semibold text-mar-950">{l.valor}</dd>
            </Fragment>
          ))}
        </dl>
      </details>
    </div>
  );
}
