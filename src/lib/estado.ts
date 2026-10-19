/**
 * Estado compartido entre páginas (test → calculadora → formulario) y enlaces con parámetros.
 *
 * Se guarda en localStorage, es decir, SOLO en el navegador del usuario: no se envía a
 * ningún servidor salvo que el usuario mande el formulario de ayuda. No son cookies.
 */

import { STORAGE_PREFIX } from '../config';
import { PREGUNTAS, esRespuestaValida, type IdPregunta, type Respuestas } from '../data/preguntas';
import { esTipoBarco, type IdTipoBarco } from '../data/tiposBarco';
import { esAmarre, esPartida, esZona } from '../data/costes';
import { entradasPorDefecto, sanear, type Ajustes, type EntradasCalculo, type Rango } from './calculoCostes';

const CLAVE_TEST = `${STORAGE_PREFIX}:test`;
const CLAVE_CALCULADORA = `${STORAGE_PREFIX}:calculadora`;

export interface EstadoTest {
  respuestas: Respuestas;
  recomendados: IdTipoBarco[];
  fecha: string;
}

export interface EstadoCalculadora {
  entradas: EntradasCalculo;
  ajustes: Ajustes;
  diasUso?: number;
  /** Rango del total anual calculado (solo partidas con dato). */
  total: Rango;
  fecha: string;
}

// ---------------------------------------------------------------------------
// localStorage (con try/catch: puede estar bloqueado en modo privado)
// ---------------------------------------------------------------------------

function leer<T>(clave: string): T | null {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? (JSON.parse(crudo) as T) : null;
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: unknown) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* sin almacenamiento: la web sigue funcionando, solo que no recuerda nada */
  }
}

function borrar(clave: string) {
  try {
    localStorage.removeItem(clave);
  } catch {
    /* nada */
  }
}

export const guardarTest = (e: Omit<EstadoTest, 'fecha'>) =>
  escribir(CLAVE_TEST, { ...e, fecha: new Date().toISOString() });
export const leerTest = () => validarTest(leer<unknown>(CLAVE_TEST));
export const borrarTest = () => borrar(CLAVE_TEST);

export const guardarCalculadora = (e: Omit<EstadoCalculadora, 'fecha'>) =>
  escribir(CLAVE_CALCULADORA, { ...e, fecha: new Date().toISOString() });
export const leerCalculadora = () => validarCalculadora(leer<unknown>(CLAVE_CALCULADORA));
export const borrarCalculadora = () => borrar(CLAVE_CALCULADORA);

/** Momento del último envío del formulario (para evitar envíos repetidos por error). */
const CLAVE_ULTIMO_ENVIO = `${STORAGE_PREFIX}:ultimoEnvio`;
export const guardarUltimoEnvio = () => escribir(CLAVE_ULTIMO_ENVIO, Date.now());
export function leerUltimoEnvio(): number | null {
  const v = leer<unknown>(CLAVE_ULTIMO_ENVIO);
  return typeof v === 'number' && Number.isFinite(v) && v <= Date.now() ? v : null;
}

// ---------------------------------------------------------------------------
// Validación: lo guardado en el navegador se trata como NO fiable (alguien puede editarlo a mano
// o venir de una versión anterior de la web). Se valida campo a campo y se descarta lo raro.
// ---------------------------------------------------------------------------

const esObjeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const numeroEn = (v: unknown, min: number, max: number): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : undefined;
const fechaValida = (v: unknown) =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : new Date().toISOString();

export function validarTest(dato: unknown): EstadoTest | null {
  if (!esObjeto(dato)) return null;
  const crudas = esObjeto(dato.respuestas) ? dato.respuestas : {};
  const respuestas: Respuestas = {};
  for (const p of PREGUNTAS) {
    const v = Object.hasOwn(crudas, p.id) ? crudas[p.id] : undefined;
    if (typeof v === 'string' && esRespuestaValida(p.id, v)) respuestas[p.id] = v;
  }
  const recomendados = Array.isArray(dato.recomendados) ? dato.recomendados.filter(esTipoBarco).slice(0, 3) : [];
  return { respuestas, recomendados, fecha: fechaValida(dato.fecha) };
}

export function validarCalculadora(dato: unknown): EstadoCalculadora | null {
  if (!esObjeto(dato) || !esObjeto(dato.entradas) || !esTipoBarco(dato.entradas.tipo)) return null;
  const e = dato.entradas;
  // Números opcionales: si no son válidos, quedan en null (sin dato), nunca se inventan.
  const opcional = (v: unknown, min: number, max: number) => numeroEn(v, min, max) ?? null;
  const uno = <T extends string>(v: unknown, permitidos: readonly T[]): T | undefined =>
    typeof v === 'string' && (permitidos as readonly string[]).includes(v) ? (v as T) : undefined;
  const modoAmarre = uno(e.modoAmarre, ['rango', 'privada', 'publico'] as const);
  const motor = uno(e.motor, ['fueraborda', 'intraborda', 'ninguno'] as const);
  const combustible = uno(e.combustible, ['gasolina', 'gasoleo'] as const);
  const antifouling = uno(e.antifouling, ['profesional', 'diy'] as const);
  const antiguedad = uno(e.antiguedad, ['nuevo', '5-15', 'otra'] as const);
  const entradas = sanear(
    entradasPorDefecto(e.tipo as IdTipoBarco, {
      ...(esZona(e.zona) && { zona: e.zona }),
      ...(esAmarre(e.amarre) && { amarre: e.amarre }),
      ...(numeroEn(e.eslora, 0, 1000) !== undefined && { eslora: e.eslora as number }),
      ...(modoAmarre && { modoAmarre }),
      precioAmarreAnual: opcional(e.precioAmarreAnual, 0, 1e7),
      tarifaM2Dia: opcional(e.tarifaM2Dia, 0, 100),
      manga: opcional(e.manga, 0, 50),
      ivaAmarre: e.ivaAmarre === true,
      valor: opcional(e.valor, 0, 1e9),
      motor: motor ?? null,
      numMotores: numeroEn(e.numMotores, 1, 4) ?? 1,
      horasMotor: opcional(e.horasMotor, 0, 100_000),
      consumoLitrosHora: opcional(e.consumoLitrosHora, 0, 1000),
      ...(combustible && { combustible }),
      ...(e.precioLitro === null
        ? { precioLitro: null }
        : numeroEn(e.precioLitro, 0, 100) !== undefined
          ? { precioLitro: e.precioLitro as number }
          : {}),
      ...(antifouling && { antifouling }),
      incluirVarada: e.incluirVarada === true,
      lista: e.lista === 6 ? 6 : 7,
      antiguedad: antiguedad ?? null,
    }),
  );
  const ajustes: Ajustes = {};
  if (esObjeto(dato.ajustes)) {
    for (const [id, v] of Object.entries(dato.ajustes)) {
      const n = numeroEn(v, 0, 1_000_000);
      if (esPartida(id) && n !== undefined) ajustes[id] = n;
    }
  }
  return {
    entradas,
    ajustes,
    diasUso: numeroEn(dato.diasUso, 1, 365),
    total: esObjeto(dato.total)
      ? { min: numeroEn(dato.total.min, 0, 1e9) ?? 0, max: numeroEn(dato.total.max, 0, 1e9) ?? 0 }
      : { min: 0, max: 0 },
    fecha: fechaValida(dato.fecha),
  };
}

// ---------------------------------------------------------------------------
// URL del test: /test/?uso=pesca&zona=med&…
// ---------------------------------------------------------------------------

/** Lee y valida las respuestas de la URL. Ignora parámetros desconocidos o inválidos. */
export function respuestasDesdeURL(search: string): Respuestas {
  const params = new URLSearchParams(search);
  const respuestas: Respuestas = {};
  for (const p of PREGUNTAS) {
    const valor = params.get(p.id);
    if (esRespuestaValida(p.id, valor)) respuestas[p.id] = valor!;
  }
  return respuestas;
}

export function queryTest(respuestas: Respuestas): string {
  const params = new URLSearchParams();
  for (const p of PREGUNTAS) {
    const valor = respuestas[p.id as IdPregunta];
    if (valor) params.set(p.id, valor);
  }
  return params.toString();
}

export const testCompleto = (r: Respuestas) => PREGUNTAS.every((p) => !!r[p.id]);

// ---------------------------------------------------------------------------
// URL de la calculadora: /calculadora/?tipo=lancha-open&eslora=6&zona=med&amarre=seca&horas=50&valor=25000&dias=25
// ---------------------------------------------------------------------------

export function urlCalculadora(entradas: Partial<EntradasCalculo>, diasUso?: number): string {
  const params = new URLSearchParams();
  if (entradas.tipo) params.set('tipo', entradas.tipo);
  if (entradas.eslora !== undefined) params.set('eslora', String(entradas.eslora));
  if (entradas.zona) params.set('zona', entradas.zona);
  if (entradas.amarre) params.set('amarre', entradas.amarre);
  if (entradas.horasMotor !== undefined && entradas.horasMotor !== null)
    params.set('horas', String(entradas.horasMotor));
  if (entradas.valor !== undefined && entradas.valor !== null) params.set('valor', String(entradas.valor));
  if (diasUso) params.set('dias', String(diasUso));
  const q = params.toString();
  return `/calculadora/${q ? `?${q}` : ''}`;
}

export function entradasDesdeURL(search: string): { entradas: Partial<EntradasCalculo>; diasUso?: number } {
  const params = new URLSearchParams(search);
  const entradas: Partial<EntradasCalculo> = {};
  const tipo = params.get('tipo');
  if (esTipoBarco(tipo)) entradas.tipo = tipo;
  const zona = params.get('zona');
  if (esZona(zona)) entradas.zona = zona;
  const amarre = params.get('amarre');
  if (esAmarre(amarre)) entradas.amarre = amarre;
  const numero = (clave: string) => {
    const v = params.get(clave);
    if (v === null || v.trim() === '') return undefined;
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const eslora = numero('eslora');
  if (eslora !== undefined) entradas.eslora = eslora;
  const horas = numero('horas');
  if (horas !== undefined) entradas.horasMotor = horas;
  const valor = numero('valor');
  if (valor !== undefined) entradas.valor = valor;
  const dias = numero('dias');
  return { entradas, diasUso: dias && dias > 0 ? dias : undefined };
}
