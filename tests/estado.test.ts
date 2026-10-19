/**
 * Tests del estado compartido (src/lib/estado.ts): enlaces con parámetros y validación de lo que
 * se guarda en el navegador. Todo lo que llega de la URL o de localStorage se trata como no fiable.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  entradasDesdeURL,
  guardarCalculadora,
  guardarTest,
  guardarUltimoEnvio,
  leerCalculadora,
  leerTest,
  leerUltimoEnvio,
  queryTest,
  respuestasDesdeURL,
  testCompleto,
  urlCalculadora,
  validarCalculadora,
  validarTest,
  type EstadoCalculadora,
} from '../src/lib/estado';
import { PREGUNTAS, type Respuestas } from '../src/data/preguntas';
import { LIMITES, entradasPorDefecto, sanear } from '../src/lib/calculoCostes';
import { PARTIDAS } from '../src/data/costes';

/** Respuestas completas que recorren todas las opciones de cada pregunta (una tanda por opción). */
const TANDAS: Respuestas[] = Array.from({ length: Math.max(...PREGUNTAS.map((p) => p.opciones.length)) }, (_, i) =>
  Object.fromEntries(PREGUNTAS.map((p) => [p.id, p.opciones[i % p.opciones.length].valor])),
);

const COMPLETAS = TANDAS[0];

/** Parte de búsqueda (?…) de una URL relativa. */
const busqueda = (url: string) => new URL(url, 'https://ejemplo.test').search;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// URL del test
// ---------------------------------------------------------------------------

describe('queryTest / respuestasDesdeURL', () => {
  it('ida y vuelta con todas las opciones de todas las preguntas', () => {
    for (const r of TANDAS) {
      expect(respuestasDesdeURL(queryTest(r))).toEqual(r);
      expect(respuestasDesdeURL(`?${queryTest(r)}`)).toEqual(r);
    }
  });

  it('ida y vuelta con respuestas incompletas', () => {
    const r: Respuestas = { uso: 'pesca', personas: '7+', dias: '<15' };
    expect(respuestasDesdeURL(queryTest(r))).toEqual(r);
  });

  it('sin respuestas no genera parámetros', () => {
    expect(queryTest({})).toBe('');
    expect(respuestasDesdeURL('')).toEqual({});
  });

  it('respeta el orden de las preguntas en la URL', () => {
    const claves = [...new URLSearchParams(queryTest(COMPLETAS)).keys()];
    expect(claves).toEqual(PREGUNTAS.map((p) => p.id));
  });

  it('ignora parámetros desconocidos, valores inválidos o vacíos y claves heredadas', () => {
    const r = respuestasDesdeURL(
      '?uso=yate&zona=med&foo=bar&personas=&dias=toString&compra=constructor&anual=__proto__&titulo=PER&guardado=seca',
    );
    expect(r).toEqual({ zona: 'med', guardado: 'seca' });
  });

  it('un "+" sin codificar no cuela una respuesta distinta', () => {
    // "7+" escrito a mano en la URL se lee como "7 " (el + es un espacio) y se descarta.
    expect(respuestasDesdeURL('?personas=7+')).toEqual({});
    expect(respuestasDesdeURL('?personas=7%2B')).toEqual({ personas: '7+' });
  });

  it('testCompleto solo es cierto con todas las preguntas contestadas', () => {
    expect(testCompleto(COMPLETAS)).toBe(true);
    expect(testCompleto({})).toBe(false);
    for (const p of PREGUNTAS) {
      const incompletas = { ...COMPLETAS };
      delete incompletas[p.id];
      expect(testCompleto(incompletas), p.id).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// URL de la calculadora
// ---------------------------------------------------------------------------

describe('urlCalculadora / entradasDesdeURL', () => {
  it('ida y vuelta con todas las entradas y los días de uso', () => {
    // La URL solo lleva tipo, eslora, zona, amarre, horas y valor.
    const entradas = {
      tipo: 'velero-pequeno' as const,
      eslora: 6.5,
      zona: 'int' as const,
      amarre: 'remolque' as const,
      horasMotor: 12,
      valor: 9000,
    };
    const url = urlCalculadora(entradas, 25);
    expect(url.startsWith('/calculadora/?')).toBe(true);
    expect(entradasDesdeURL(busqueda(url))).toEqual({ entradas, diasUso: 25 });
  });

  it('ida y vuelta con entradas parciales', () => {
    const entradas = { tipo: 'catamaran' as const, horasMotor: 0 };
    expect(entradasDesdeURL(busqueda(urlCalculadora(entradas)))).toEqual({ entradas, diasUso: undefined });
  });

  it('sin entradas, la URL no lleva "?"', () => {
    expect(urlCalculadora({})).toBe('/calculadora/');
    expect(entradasDesdeURL('')).toEqual({ entradas: {}, diasUso: undefined });
  });

  it('ignora tipos, zonas y amarres desconocidos, incluidas claves heredadas', () => {
    for (const malo of ['yate', 'toString', 'constructor', '__proto__', 'hasOwnProperty', '']) {
      const { entradas } = entradasDesdeURL(`?tipo=${malo}&zona=${malo}&amarre=${malo}`);
      expect(entradas, malo).toEqual({});
    }
  });

  it('ignora números inválidos o negativos y acepta la coma decimal', () => {
    const { entradas, diasUso } = entradasDesdeURL('?eslora=abc&horas=-5&valor=Infinity&dias=0');
    expect(entradas).toEqual({});
    expect(diasUso).toBeUndefined();

    expect(entradasDesdeURL('?eslora=6,5&horas=%20&valor=1e4&dias=-3')).toEqual({
      entradas: { eslora: 6.5, valor: 10_000 },
      diasUso: undefined,
    });
  });
});

// ---------------------------------------------------------------------------
// Validación de lo guardado en el navegador
// ---------------------------------------------------------------------------

describe('validarTest', () => {
  it('rechaza lo que no es un objeto', () => {
    for (const malo of [null, undefined, 42, 'texto', [], [COMPLETAS], true]) {
      expect(validarTest(malo)).toBeNull();
    }
  });

  it('conserva un estado válido', () => {
    const estado = {
      respuestas: COMPLETAS,
      recomendados: ['semirrigida', 'lancha-open'],
      fecha: '2026-01-02T03:04:05.000Z',
    };
    expect(validarTest(JSON.parse(JSON.stringify(estado)))).toEqual(estado);
  });

  it('filtra respuestas inválidas y claves que no son propias', () => {
    const heredadas = Object.create({ uso: 'pesca' }) as Record<string, unknown>;
    heredadas.zona = 'med';
    heredadas.personas = 'muchas';
    heredadas.dias = 15;
    heredadas.inventada = 'x';
    expect(validarTest({ respuestas: heredadas, recomendados: [] })?.respuestas).toEqual({ zona: 'med' });
  });

  it('respuestas que no son un objeto se quedan vacías', () => {
    for (const malo of [null, 'uso=pesca', ['pesca'], 3]) {
      expect(validarTest({ respuestas: malo })?.respuestas).toEqual({});
    }
  });

  it('solo deja tipos de barco conocidos en los recomendados, como mucho tres', () => {
    const r = validarTest({
      respuestas: {},
      recomendados: ['toString', 'catamaran', 7, null, 'yate', 'semirrigida', 'moto-agua', 'lancha-open'],
    });
    expect(r?.recomendados).toEqual(['catamaran', 'semirrigida', 'moto-agua']);
    expect(validarTest({ recomendados: 'catamaran' })?.recomendados).toEqual([]);
  });

  it('sustituye una fecha inválida por una válida', () => {
    for (const fecha of [undefined, 'ayer', 12345, null]) {
      const r = validarTest({ respuestas: {}, fecha });
      expect(Number.isNaN(Date.parse(r!.fecha))).toBe(false);
    }
  });
});

describe('validarCalculadora', () => {
  const entradas = entradasPorDefecto('lancha-cabina', { zona: 'atl', amarre: 'seca', eslora: 8.5 });
  const valido: EstadoCalculadora = {
    entradas,
    ajustes: { amarre: 1500, imprevistos: 0 },
    diasUso: 30,
    total: { min: 4000, max: 9000 },
    fecha: '2026-05-06T07:08:09.000Z',
  };

  it('conserva un estado válido', () => {
    expect(validarCalculadora(JSON.parse(JSON.stringify(valido)))).toEqual(valido);
  });

  it('rechaza estados sin entradas o con un tipo desconocido (incluidas claves heredadas)', () => {
    for (const malo of [null, 'x', [], {}, { entradas: null }, { entradas: [] }, { entradas: {} }]) {
      expect(validarCalculadora(malo)).toBeNull();
    }
    for (const tipo of ['yate', 'toString', 'constructor', '__proto__', 3]) {
      expect(validarCalculadora({ ...valido, entradas: { ...entradas, tipo } }), String(tipo)).toBeNull();
    }
  });

  it('cambia zona, amarre y números inválidos por los valores por defecto del tipo', () => {
    const def = entradasPorDefecto('lancha-cabina');
    const r = validarCalculadora({
      entradas: {
        tipo: 'lancha-cabina',
        zona: 'constructor',
        amarre: 'toString',
        eslora: 'mucha',
        horasMotor: -1,
        valor: null,
      },
    });
    expect(r?.entradas).toEqual(def);
  });

  it('recorta las entradas a los límites de la calculadora', () => {
    const r = validarCalculadora({ entradas: { ...entradas, eslora: LIMITES.eslora.max + 50, valor: 0 } });
    expect(r?.entradas.eslora).toBe(LIMITES.eslora.max);
    expect(r?.entradas).toEqual(sanear({ ...entradas, eslora: LIMITES.eslora.max + 50, valor: 0 }));
  });

  it('solo conserva ajustes de partidas existentes con importes válidos', () => {
    const r = validarCalculadora({
      ...valido,
      ajustes: {
        amarre: 1200,
        seguro: -5,
        combustible: Number.NaN,
        itb: '300',
        motor: 0,
        mantenimiento: 100, // partida de una versión anterior: ya no existe
        toString: 10,
        propina: 50,
      },
    });
    expect(r?.ajustes).toEqual({ amarre: 1200, motor: 0 });
    for (const id of Object.keys(r!.ajustes)) expect(PARTIDAS.map((p) => p.id)).toContain(id);
  });

  it('ajustes que no son un objeto se quedan vacíos', () => {
    for (const malo of [null, [100, 200], 'amarre=5']) {
      expect(validarCalculadora({ ...valido, ajustes: malo })?.ajustes).toEqual({});
    }
  });

  it('descarta días de uso fuera de 1–365 y totales inválidos', () => {
    for (const diasUso of [0, -3, 366, Number.NaN, '20', null]) {
      expect(validarCalculadora({ ...valido, diasUso })?.diasUso, String(diasUso)).toBeUndefined();
    }
    expect(validarCalculadora({ ...valido, diasUso: 365 })?.diasUso).toBe(365);
    for (const total of [{ min: -1, max: Infinity }, { min: '9000', max: null }, null, 9000]) {
      expect(validarCalculadora({ ...valido, total })?.total, JSON.stringify(total)).toEqual({ min: 0, max: 0 });
    }
  });
});

// ---------------------------------------------------------------------------
// localStorage
// ---------------------------------------------------------------------------

/** localStorage en memoria para los tests. */
function almacenEnMemoria() {
  const datos = new Map<string, string>();
  return {
    datos,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, String(v)),
    removeItem: (k: string) => void datos.delete(k),
  };
}

describe('guardar y leer del navegador', () => {
  it('ida y vuelta del test y de la calculadora', () => {
    vi.stubGlobal('localStorage', almacenEnMemoria());
    guardarTest({ respuestas: COMPLETAS, recomendados: ['velero-crucero', 'catamaran'] });
    expect(leerTest()).toMatchObject({ respuestas: COMPLETAS, recomendados: ['velero-crucero', 'catamaran'] });

    const entradas = entradasPorDefecto('semirrigida', { amarre: 'remolque' });
    const total = { min: 1500, max: 2500 };
    guardarCalculadora({ entradas, ajustes: { combustible: 300 }, diasUso: 12, total });
    expect(leerCalculadora()).toMatchObject({ entradas, ajustes: { combustible: 300 }, diasUso: 12, total });
  });

  it('lo guardado se valida al leerlo', () => {
    const almacen = almacenEnMemoria();
    vi.stubGlobal('localStorage', almacen);
    guardarTest({ respuestas: {}, recomendados: [] });
    const [claveTest] = [...almacen.datos.keys()];
    almacen.datos.set(
      claveTest,
      JSON.stringify({ respuestas: { uso: 'yate', zona: 'bal' }, recomendados: ['toString'] }),
    );
    expect(leerTest()).toMatchObject({ respuestas: { zona: 'bal' }, recomendados: [] });

    almacen.datos.set(claveTest, '{esto no es JSON');
    expect(leerTest()).toBeNull();
  });

  it('sin nada guardado devuelve null', () => {
    vi.stubGlobal('localStorage', almacenEnMemoria());
    expect(leerTest()).toBeNull();
    expect(leerCalculadora()).toBeNull();
    expect(leerUltimoEnvio()).toBeNull();
  });

  it('si el navegador bloquea el almacenamiento, ni guardar ni leer fallan', () => {
    const bloqueado = () => {
      throw new Error('SecurityError');
    };
    vi.stubGlobal('localStorage', { getItem: bloqueado, setItem: bloqueado, removeItem: bloqueado });
    expect(() => guardarTest({ respuestas: COMPLETAS, recomendados: [] })).not.toThrow();
    expect(() => guardarUltimoEnvio()).not.toThrow();
    expect(leerTest()).toBeNull();
    expect(leerCalculadora()).toBeNull();
    expect(leerUltimoEnvio()).toBeNull();
  });

  it('último envío: devuelve la marca guardada y descarta valores raros o futuros', () => {
    const almacen = almacenEnMemoria();
    vi.stubGlobal('localStorage', almacen);
    vi.useFakeTimers({ now: new Date('2026-03-01T10:00:00Z') });
    guardarUltimoEnvio();
    expect(leerUltimoEnvio()).toBe(Date.now());

    const [clave] = [...almacen.datos.keys()];
    for (const raro of ['"ayer"', 'null', '{}', String(Date.now() + 60_000)]) {
      almacen.datos.set(clave, raro);
      expect(leerUltimoEnvio(), raro).toBeNull();
    }
  });
});
