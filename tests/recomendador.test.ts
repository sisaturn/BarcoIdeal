/**
 * Tests del recomendador (src/data/recomendador.ts).
 *
 * Protegen la LÓGICA, no las cifras: los puntos de REGLAS se pueden ajustar y los importes vienen de
 * datos verificados que pueden cambiar o estar a null (sin dato). Por eso los perfiles usan respuestas
 * que no dependen de los importes y el resto de comprobaciones comparan relaciones (orden, descartes,
 * coherencia con la calculadora, reglas que se desactivan sin dato) y no puntos concretos.
 */
import { describe, expect, it } from 'vitest';
import {
  NIVELES_ENCAJE,
  NOTAS,
  REGLAS,
  nivelEncaje,
  notasPara,
  puntuarTodos,
  recomendar,
  type Recomendacion,
} from '../src/data/recomendador';
import { PREGUNTAS, esRespuestaValida, type Respuestas } from '../src/data/preguntas';
import { TIPOS_BARCO, esTipoBarco } from '../src/data/tiposBarco';
import { TITULACIONES, esloraMaximaPara, type IdTitulacion } from '../src/data/titulaciones';
import { costeAnual } from '../src/lib/calculoCostes';

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Generador pseudoaleatorio con semilla (mulberry32): los tests salen siempre igual. */
function aleatorio(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Copia barajada (Fisher-Yates) con el generador indicado. */
function barajar<T>(lista: readonly T[], rnd: () => number): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Respuestas al azar; con `probVacia` > 0 deja algunas preguntas sin contestar. */
function respuestasAlAzar(rnd: () => number, probVacia = 0): Respuestas {
  const r: Respuestas = {};
  for (const p of PREGUNTAS) {
    if (rnd() < probVacia) continue;
    r[p.id] = p.opciones[Math.floor(rnd() * p.opciones.length)].valor;
  }
  return r;
}

/** Muestra fija de respuestas: completas, incompletas y el test vacío. */
const MUESTRA: Respuestas[] = (() => {
  const rnd = aleatorio(2024);
  return [
    {},
    ...Array.from({ length: 400 }, () => respuestasAlAzar(rnd)),
    ...Array.from({ length: 100 }, () => respuestasAlAzar(rnd, 0.4)),
  ];
})();

const ids = (lista: Recomendacion[]) => lista.map((x) => x.tipo.id);

const nivelTitulo = (id: IdTitulacion) => TITULACIONES[id].nivel;

/** ¿Tiene el tipo alguna línea de puntos que venga de esta pregunta? ("Gasto anual: …") */
const puntuaPor = (x: Recomendacion, id: 'anual' | 'compra') => {
  const corto = PREGUNTAS.find((p) => p.id === id)!.corto;
  return x.detalle.filter((l) => l.origen.startsWith(`${corto}:`));
};

// ---------------------------------------------------------------------------
// Perfiles representativos
// ---------------------------------------------------------------------------

describe('perfiles representativos', () => {
  it('familia principiante con licencia y marina seca → semirrígida y lancha open', () => {
    const r = recomendar({
      uso: 'paseo',
      zona: 'med',
      personas: '3-4',
      dias: '15-40',
      compra: '10-30',
      anual: '4-8',
      titulo: 'licencia',
      guardado: 'seca',
      experiencia: 'ninguna',
      propulsion: 'motor',
    });
    expect(ids(r).slice(0, 2).sort()).toEqual(['lancha-open', 'semirrigida']);
  });

  it('travesías en Baleares con PER y vela → velero crucero primero', () => {
    const r = recomendar({
      uso: 'travesias',
      zona: 'bal',
      personas: '3-4',
      dias: '40-80',
      compra: '60-120',
      anual: '15+',
      titulo: 'per',
      guardado: 'puerto',
      experiencia: 'media',
      propulsion: 'vela',
    });
    expect(r[0].tipo.id).toBe('velero-crucero');
  });

  it('embalse sin titulación → velero pequeño y semirrígida', () => {
    const r = recomendar({
      uso: 'paseo',
      zona: 'int',
      personas: '1-2',
      dias: '15-40',
      compra: '<10',
      anual: '1.5-4',
      titulo: 'ninguna',
      guardado: 'remolque',
      experiencia: 'alguna',
      propulsion: 'igual',
    });
    expect(ids(r).slice(0, 2).sort()).toEqual(['semirrigida', 'velero-pequeno']);
    // Sin titulación ninguno de los recomendados puede estar descartado.
    expect(r.every((x) => !x.descartado)).toBe(true);
  });

  it('vivir a bordo en Canarias con un grupo grande → catamarán primero', () => {
    const r = recomendar({
      uso: 'vivir',
      zona: 'can',
      personas: '7+',
      dias: '80+',
      compra: '120+',
      anual: '15+',
      titulo: 'per',
      guardado: 'puerto',
      experiencia: 'mucha',
      propulsion: 'vela',
    });
    expect(r[0].tipo.id).toBe('catamaran');
  });
});

// ---------------------------------------------------------------------------
// recomendar
// ---------------------------------------------------------------------------

describe('recomendar', () => {
  it('siempre devuelve 2 o 3 tipos distintos', () => {
    for (const respuestas of MUESTRA) {
      const r = recomendar(respuestas);
      expect(r.length, JSON.stringify(respuestas)).toBeGreaterThanOrEqual(2);
      expect(r.length, JSON.stringify(respuestas)).toBeLessThanOrEqual(3);
      expect(new Set(ids(r)).size).toBe(r.length);
    }
  });

  it('devuelve los primeros de puntuarTodos, en el mismo orden', () => {
    for (const respuestas of MUESTRA) {
      const r = recomendar(respuestas);
      expect(ids(r)).toEqual(ids(puntuarTodos(respuestas)).slice(0, r.length));
    }
  });

  it('el tercero solo aparece si no está descartado y suma puntos', () => {
    for (const respuestas of MUESTRA) {
      const tercero = recomendar(respuestas)[2];
      if (!tercero) continue;
      expect(tercero.descartado).toBeUndefined();
      expect(tercero.puntos).toBeGreaterThan(0);
    }
  });

  it('no recomienda un tipo descartado mientras haya al menos dos sin descartar', () => {
    for (const respuestas of MUESTRA) {
      const validos = puntuarTodos(respuestas).filter((x) => !x.descartado).length;
      if (validos < 2) continue;
      expect(recomendar(respuestas).every((x) => !x.descartado)).toBe(true);
    }
  });

  it('no depende del orden de las reglas', () => {
    const original = [...REGLAS];
    const rnd = aleatorio(7);
    const ordenes = [
      [...original].reverse(),
      barajar(original, rnd),
      barajar(original, rnd),
      [...original].sort((a, b) => a.pregunta.localeCompare(b.pregunta) || b.respuesta.localeCompare(a.respuesta)),
    ];
    const resumen = (respuestas: Respuestas) =>
      puntuarTodos(respuestas).map((x) => ({
        id: x.tipo.id,
        puntos: x.puntos,
        descartado: x.descartado,
        aFavor: [...x.aFavor].sort(),
        enContra: [...x.enContra].sort(),
      }));
    const esperado = MUESTRA.map((respuestas) => ({
      recomendados: ids(recomendar(respuestas)),
      todos: resumen(respuestas),
    }));

    try {
      for (const orden of ordenes) {
        REGLAS.splice(0, REGLAS.length, ...orden);
        MUESTRA.forEach((respuestas, i) => {
          expect(ids(recomendar(respuestas))).toEqual(esperado[i].recomendados);
          expect(resumen(respuestas)).toEqual(esperado[i].todos);
        });
      }
    } finally {
      REGLAS.splice(0, REGLAS.length, ...original);
    }
  });
});

// ---------------------------------------------------------------------------
// puntuarTodos
// ---------------------------------------------------------------------------

describe('puntuarTodos', () => {
  it('puntúa todos los tipos una sola vez', () => {
    const todos = ids(puntuarTodos({})).sort();
    expect(todos).toEqual(Object.keys(TIPOS_BARCO).sort());
  });

  it('sin respuestas, ningún tipo suma puntos ni queda descartado', () => {
    for (const x of puntuarTodos({})) {
      expect(x.puntos).toBe(0);
      expect(x.descartado).toBeUndefined();
      expect(x.detalle).toEqual([]);
    }
  });

  it('pone los descartados al final y ordena cada grupo de más a menos puntos', () => {
    for (const respuestas of MUESTRA) {
      const todos = puntuarTodos(respuestas);
      const primerDescartado = todos.findIndex((x) => x.descartado);
      if (primerDescartado >= 0) {
        expect(todos.slice(primerDescartado).every((x) => x.descartado)).toBe(true);
      }
      for (let i = 1; i < todos.length; i++) {
        if (!!todos[i - 1].descartado === !!todos[i].descartado) {
          expect(todos[i - 1].puntos).toBeGreaterThanOrEqual(todos[i].puntos);
        }
      }
    }
  });

  it('descarta justo los tipos que exigen más titulación de la elegida', () => {
    for (const titulo of Object.keys(TITULACIONES) as IdTitulacion[]) {
      for (const x of puntuarTodos({ titulo })) {
        const exigeMas = nivelTitulo(x.tipo.titulacionMinima) > nivelTitulo(titulo);
        expect(!!x.descartado, `${titulo} / ${x.tipo.id}`).toBe(exigeMas);
      }
    }
  });

  it('los puntos son la suma del desglose', () => {
    for (const respuestas of MUESTRA) {
      for (const x of puntuarTodos(respuestas)) {
        expect(x.puntos).toBe(x.detalle.reduce((s, l) => s + l.puntos, 0));
        expect(x.detalle.every((l) => l.puntos !== 0)).toBe(true);
      }
    }
  });

  it('el coste anual estimado es el total de la calculadora con sus entradas, o null si nada tiene importe', () => {
    for (const respuestas of MUESTRA.slice(0, 60)) {
      for (const x of puntuarTodos(respuestas)) {
        const d = costeAnual(x.entradasCalculadora);
        const conImporte = d.partidas.filter((p) => p.valor !== null && p.valor.max > 0);
        if (conImporte.length === 0) expect(x.costeAnualEstimado).toBeNull();
        else expect(x.costeAnualEstimado).toEqual(d.total);
        // costeIncluye nombra exactamente las partidas con importe: nunca una sin dato.
        expect(x.costeIncluye).toEqual(conImporte.map((p) => p.nombre.toLowerCase()));
        expect(x.entradasCalculadora.tipo).toBe(x.tipo.id);
        expect(x.tipo.guardado).toContain(x.entradasCalculadora.amarre);
        if (respuestas.zona) expect(x.entradasCalculadora.zona).toBe(respuestas.zona);
      }
    }
  });

  it('usa el amarre elegido si es realista para el tipo', () => {
    for (const guardado of ['puerto', 'seca', 'remolque'] as const) {
      for (const x of puntuarTodos({ guardado })) {
        if (x.tipo.guardado.includes(guardado)) expect(x.entradasCalculadora.amarre).toBe(guardado);
        else expect(x.entradasCalculadora.amarre).toBe(x.tipo.guardado[0]);
      }
    }
  });

  it('recorta la eslora a lo que permite la titulación (motor o vela) sin bajar del mínimo del tipo', () => {
    for (const titulo of Object.keys(TITULACIONES) as IdTitulacion[]) {
      for (const x of puntuarTodos({ titulo })) {
        const maxTitulo = esloraMaximaPara(TITULACIONES[titulo], x.tipo.propulsion);
        const { min, max, tipica } = x.eslora;
        expect(min).toBe(x.tipo.eslora.min);
        expect(max).toBeGreaterThanOrEqual(min);
        expect(max).toBeLessThanOrEqual(x.tipo.eslora.max);
        if (maxTitulo !== null) expect(max).toBeLessThanOrEqual(Math.max(min, maxTitulo));
        expect(tipica).toBeLessThanOrEqual(max);
        expect(x.entradasCalculadora.eslora).toBe(tipica);
      }
    }
  });

  it('sin límite de eslora en la titulación, se mantiene la eslora del tipo', () => {
    for (const titulo of Object.keys(TITULACIONES) as IdTitulacion[]) {
      for (const x of puntuarTodos({ titulo })) {
        if (esloraMaximaPara(TITULACIONES[titulo], x.tipo.propulsion) !== null) continue;
        expect(x.eslora).toEqual(x.tipo.eslora);
      }
    }
  });

  it('el presupuesto anual solo puntúa a los tipos con coste estimable', () => {
    const anual = PREGUNTAS.find((p) => p.id === 'anual')!;
    for (const o of anual.opciones) {
      for (const x of puntuarTodos({ anual: o.valor })) {
        if (x.costeAnualEstimado === null) expect(puntuaPor(x, 'anual'), `${o.valor} / ${x.tipo.id}`).toEqual([]);
        else expect(puntuaPor(x, 'anual').length).toBeLessThanOrEqual(1);
      }
    }
  });

  it('con el presupuesto anual más alto, lo estimable siempre entra', () => {
    const anual = PREGUNTAS.find((p) => p.id === 'anual')!;
    const masAlto = anual.opciones.at(-1)!.valor;
    for (const x of puntuarTodos({ anual: masAlto })) {
      if (x.costeAnualEstimado === null) continue;
      const lineas = puntuaPor(x, 'anual');
      expect(lineas.length, x.tipo.id).toBe(1);
      expect(lineas[0].puntos).toBeGreaterThan(0);
    }
  });

  it('el presupuesto de compra no puntúa a los tipos sin precio de compra (null)', () => {
    const compra = PREGUNTAS.find((p) => p.id === 'compra')!;
    for (const o of compra.opciones) {
      for (const x of puntuarTodos({ compra: o.valor })) {
        if (x.tipo.precioCompra === null) expect(puntuaPor(x, 'compra'), `${o.valor} / ${x.tipo.id}`).toEqual([]);
      }
    }
  });

  it('motivos a favor y en contra sin duplicados ni textos vacíos', () => {
    for (const respuestas of MUESTRA) {
      for (const x of puntuarTodos(respuestas)) {
        for (const lista of [x.aFavor, x.enContra]) {
          expect(lista.every((t) => t.trim().length > 0)).toBe(true);
          expect(new Set(lista).size).toBe(lista.length);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// nivelEncaje
// ---------------------------------------------------------------------------

describe('nivelEncaje', () => {
  const base = puntuarTodos({})[0];

  it('NIVELES_ENCAJE va de mayor a menor umbral y el último cubre cualquier puntuación', () => {
    for (let i = 1; i < NIVELES_ENCAJE.length; i++) {
      expect(NIVELES_ENCAJE[i - 1].desde).toBeGreaterThan(NIVELES_ENCAJE[i].desde);
    }
    expect(NIVELES_ENCAJE.at(-1)!.desde).toBe(-Infinity);
  });

  it('elige el nivel cuyo umbral se alcanza, justo en el límite y por debajo', () => {
    NIVELES_ENCAJE.forEach((nivel, i) => {
      if (!Number.isFinite(nivel.desde)) return;
      expect(nivelEncaje({ ...base, puntos: nivel.desde })).toEqual(nivel);
      expect(nivelEncaje({ ...base, puntos: nivel.desde - 0.5 })).toEqual(NIVELES_ENCAJE[i + 1]);
    });
    expect(nivelEncaje({ ...base, puntos: -1000 })).toEqual(NIVELES_ENCAJE.at(-1));
    expect(nivelEncaje({ ...base, puntos: 1000 })).toEqual(NIVELES_ENCAJE[0]);
  });

  it('un tipo descartado se marca aparte, con tono bajo, tenga los puntos que tenga', () => {
    const textos = NIVELES_ENCAJE.map((n) => n.texto);
    const n = nivelEncaje({ ...base, puntos: 1000, descartado: 'Necesitarías más titulación.' });
    expect(n.tono).toBe('bajo');
    expect(textos).not.toContain(n.texto);
  });
});

// ---------------------------------------------------------------------------
// notasPara
// ---------------------------------------------------------------------------

describe('notasPara', () => {
  it('sin respuestas no hay notas', () => {
    expect(notasPara({})).toEqual([]);
  });

  it('cada nota aparece con su respuesta y solo con ella', () => {
    for (const nota of NOTAS) {
      expect(notasPara({ [nota.pregunta]: nota.respuesta })).toContain(nota.texto);
      const pregunta = PREGUNTAS.find((p) => p.id === nota.pregunta)!;
      for (const o of pregunta.opciones) {
        expect(notasPara({ [nota.pregunta]: o.valor }).includes(nota.texto)).toBe(o.valor === nota.respuesta);
      }
    }
  });

  it('devuelve las notas en el orden de NOTAS', () => {
    const todas: Respuestas = Object.fromEntries(NOTAS.map((n) => [n.pregunta, n.respuesta]));
    const esperadas = NOTAS.filter((n) => todas[n.pregunta] === n.respuesta).map((n) => n.texto);
    expect(notasPara(todas)).toEqual(esperadas);
  });
});

// ---------------------------------------------------------------------------
// Integridad de las tablas (detecta erratas al editar REGLAS o NOTAS)
// ---------------------------------------------------------------------------

describe('tablas del recomendador', () => {
  it('cada regla usa una respuesta que existe y tipos de barco válidos', () => {
    for (const regla of REGLAS) {
      expect(esRespuestaValida(regla.pregunta, regla.respuesta), `${regla.pregunta}=${regla.respuesta}`).toBe(true);
      for (const id of Object.keys(regla.puntos)) expect(esTipoBarco(id), id).toBe(true);
    }
  });

  it('no hay dos reglas para la misma respuesta', () => {
    const claves = REGLAS.map((r) => `${r.pregunta}=${r.respuesta}`);
    expect(new Set(claves).size).toBe(claves.length);
  });

  it('cada nota usa una respuesta que existe', () => {
    for (const nota of NOTAS) expect(esRespuestaValida(nota.pregunta, nota.respuesta)).toBe(true);
  });
});
