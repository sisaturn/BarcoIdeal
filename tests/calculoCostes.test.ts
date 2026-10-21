/**
 * Tests de la calculadora de coste anual (src/lib/calculoCostes.ts), con rangos y huecos explícitos.
 *
 * Regla del proyecto: no se inventa ninguna cifra y lo que no tiene dato es null. Estos tests no fijan
 * importes: comprueban relaciones (total = suma de lo que tiene dato, marina seca = factor × puerto,
 * IVA, ajustes del usuario…) leyendo las constantes de src/data/ cuando hace falta.
 */
import { describe, expect, it } from 'vitest';
import {
  LIMITES,
  calcularDesglose,
  costeAnual,
  entradasPorDefecto,
  sanear,
  textoRango,
  tieneMotor,
  type Desglose,
  type EntradasCalculo,
  type Rango,
} from '../src/lib/calculoCostes';
import { PARTIDAS, TIPOS_AMARRE, ZONAS, type IdAmarre, type IdPartida } from '../src/data/costes';
import { FACTOR_MARINA_SECA, RANGOS_AMARRE, REMOLQUE, rangoAmarrePara } from '../src/data/amarres';
import { SEGURO_MERCADO } from '../src/data/seguro';
import { ANTIFOULING, INTERVALO_REVISION, REGLA_SECTOR, REVISION_MOTOR, VARADA } from '../src/data/mantenimiento';
import { periodicidadPara, type Lista } from '../src/data/inspeccion';
import { IVA_NUEVA } from '../src/data/impuestos';
import { TIPOS_BARCO, type IdTipoBarco } from '../src/data/tiposBarco';
import { euros } from '../src/lib/formato';

const TIPOS = Object.keys(TIPOS_BARCO) as IdTipoBarco[];
const AMARRES = Object.keys(TIPOS_AMARRE) as IdAmarre[];
const FUERA_DEL_AGUA = AMARRES.filter((a) => !TIPOS_AMARRE[a].enElAgua);
const EN_EL_AGUA = AMARRES.filter((a) => TIPOS_AMARRE[a].enElAgua);
/** Formas de guardarlo que pagan un amarre por eslora (puerto o marina seca). */
const CON_AMARRE = AMARRES.filter((a) => a !== 'remolque');
const ESLORA_MAX_TABLA = Math.max(...RANGOS_AMARRE.map((r) => r.eslora));
const ESLORAS = [2.5, 4, 6, 6.5, 8, 9, 10, 11.5, 12, 12.5, 15, 24];
const IVA = 1 + IVA_NUEVA.tipo;

/** Entradas con todos los datos rellenos (para que haya el máximo de partidas con valor). */
const completas = (tipo: IdTipoBarco, parcial: Partial<EntradasCalculo> = {}) =>
  entradasPorDefecto(tipo, {
    valor: 20_000,
    motor: 'fueraborda-pequeno',
    horasMotor: 50,
    consumoLitrosHora: 10,
    precioLitro: 2,
    antiguedad: 'nuevo',
    ...parcial,
  });

/** Combinaciones variadas: por defecto (con huecos) y completas, en todas las formas de guardarlo y esloras. */
const COMBINACIONES: EntradasCalculo[] = TIPOS.flatMap((tipo) =>
  AMARRES.flatMap((amarre) =>
    [TIPOS_BARCO[tipo].eslora.tipica, 5, 7, 13].flatMap((eslora) => [
      entradasPorDefecto(tipo, { amarre, eslora }),
      completas(tipo, { amarre, eslora, incluirVarada: true, lista: 6, antifouling: 'diy' }),
    ]),
  ),
);

const partida = (d: Desglose, id: IdPartida) => d.partidas.find((p) => p.id === id)!;
const valorDe = (e: EntradasCalculo, id: IdPartida) => partida(calcularDesglose(e), id).valor;
const nombre = (e: EntradasCalculo) => `${e.tipo} / ${e.amarre} / ${e.modoAmarre} / ${e.eslora} m`;
const exacto = (n: number): Rango => ({ min: n, max: n });
const escalar = (r: Rango, k: number): Rango => ({ min: r.min * k, max: r.max * k });

/** Compara rangos con tolerancia de coma flotante. */
function esperarRango(real: Rango | null, esperado: Rango, mensaje?: string) {
  expect(real, mensaje).not.toBeNull();
  expect(real!.min, mensaje).toBeCloseTo(esperado.min, 6);
  expect(real!.max, mensaje).toBeCloseTo(esperado.max, 6);
}

// ---------------------------------------------------------------------------

describe('entradasPorDefecto', () => {
  it('parte de la eslora típica y la primera forma de guardarlo, y deja en null lo que no sabemos', () => {
    for (const tipo of TIPOS) {
      const e = entradasPorDefecto(tipo);
      expect(e.tipo).toBe(tipo);
      expect(e.eslora).toBe(TIPOS_BARCO[tipo].eslora.tipica);
      expect(e.amarre).toBe(TIPOS_BARCO[tipo].guardado[0]);
      expect(Object.keys(ZONAS)).toContain(e.zona);
      expect(e).toMatchObject({
        valor: null,
        motor: null,
        horasMotor: null,
        consumoLitrosHora: null,
        precioAmarreAnual: null,
        tarifaM2Dia: null,
        manga: null,
        antiguedad: null,
      });
    }
  });

  it('lo que se pasa en `parcial` sustituye a los valores por defecto', () => {
    const e = entradasPorDefecto('lancha-open', { eslora: 7.5, zona: 'atl', horasMotor: 0, motor: 'ninguno' });
    expect(e).toMatchObject({ tipo: 'lancha-open', eslora: 7.5, zona: 'atl', horasMotor: 0, motor: 'ninguno' });
  });
});

describe('calcularDesglose: estructura y totales', () => {
  it('devuelve todas las partidas, en el orden de PARTIDAS', () => {
    for (const e of COMBINACIONES) {
      expect(calcularDesglose(e).partidas.map((p) => p.id)).toEqual(PARTIDAS.map((p) => p.id));
    }
  });

  it('el total es la suma de los valores que no son null y el mensual, la doceava parte', () => {
    for (const e of COMBINACIONES) {
      const d = calcularDesglose(e);
      const conDato = d.partidas.filter((p) => p.valor !== null);
      esperarRango(
        d.total,
        {
          min: conDato.reduce((s, p) => s + p.valor!.min, 0),
          max: conDato.reduce((s, p) => s + p.valor!.max, 0),
        },
        nombre(e),
      );
      esperarRango(d.mensual, escalar(d.total, 1 / 12), nombre(e));
    }
  });

  it('sinDato son exactamente las partidas sin valor, y cada una explica qué falta', () => {
    for (const e of COMBINACIONES) {
      const d = calcularDesglose(e);
      expect(d.sinDato.map((p) => p.id)).toEqual(d.partidas.filter((p) => p.valor === null).map((p) => p.id));
      for (const p of d.partidas) {
        if (p.valor === null) expect(p.sinDato, `${nombre(e)} / ${p.id}`).toBeTruthy();
        else expect(p.sinDato, `${nombre(e)} / ${p.id}`).toBeUndefined();
      }
    }
  });

  it('todos los rangos son finitos, no negativos y con mínimo ≤ máximo', () => {
    for (const e of COMBINACIONES) {
      const d = calcularDesglose(e);
      const rangos = [d.total, d.mensual, ...d.partidas.flatMap((p) => [p.valor, p.estimado])];
      if (d.reglaSector) rangos.push(d.reglaSector);
      for (const r of rangos) {
        if (r === null) continue;
        expect(Number.isFinite(r.min) && Number.isFinite(r.max), nombre(e)).toBe(true);
        expect(r.min, nombre(e)).toBeGreaterThanOrEqual(0);
        expect(r.min, nombre(e)).toBeLessThanOrEqual(r.max);
      }
    }
  });

  it('sin ajustes, el valor de cada partida es su estimación y todas son de mercado', () => {
    for (const e of COMBINACIONES) {
      for (const p of calcularDesglose(e).partidas) {
        expect(p.editado).toBe(false);
        expect(p.valor).toEqual(p.estimado);
        expect(p.esMercado).toBe(true);
        expect(p.explicacion.length).toBeGreaterThan(0);
      }
    }
  });

  it('costeAnual devuelve el mismo desglose, sin ajustes', () => {
    for (const e of COMBINACIONES.slice(0, 20)) expect(costeAnual(e)).toEqual(calcularDesglose(e));
  });

  it('no modifica las entradas que recibe', () => {
    const e = { ...entradasPorDefecto('catamaran'), eslora: Number.NaN, valor: -5, numMotores: 9 };
    const copia = { ...e };
    calcularDesglose(e, { amarre: 100 });
    expect(e).toEqual(copia);
  });

  it('tasas e imprevistos no tienen dato salvo que el usuario los escriba', () => {
    for (const e of COMBINACIONES) {
      const d = calcularDesglose(e);
      expect(partida(d, 'tasas').valor).toBeNull();
      expect(partida(d, 'imprevistos').valor).toBeNull();
    }
  });
});

describe('amarre', () => {
  it('modo rango: usa la fila de la tabla igual o superior a la eslora', () => {
    for (const eslora of ESLORAS.filter((x) => x <= ESLORA_MAX_TABLA)) {
      const fila = rangoAmarrePara(eslora)!;
      const e = entradasPorDefecto('velero-crucero', { amarre: 'puerto', modoAmarre: 'rango', eslora });
      esperarRango(valorDe(e, 'amarre'), { min: fila.min, max: fila.max }, `${eslora} m`);
    }
  });

  it('modo rango: más allá de la última fila de la tabla no hay dato (null)', () => {
    for (const amarre of CON_AMARRE) {
      for (const eslora of [ESLORA_MAX_TABLA + 0.5, ESLORA_MAX_TABLA * 2]) {
        const d = calcularDesglose(entradasPorDefecto('catamaran', { amarre, modoAmarre: 'rango', eslora }));
        expect(partida(d, 'amarre').valor, `${amarre} / ${eslora} m`).toBeNull();
        expect(d.sinDato.map((p) => p.id)).toContain('amarre');
      }
    }
  });

  it('marina seca = FACTOR_MARINA_SECA × amarre en puerto', () => {
    for (const eslora of ESLORAS.filter((x) => x <= ESLORA_MAX_TABLA)) {
      for (const ivaAmarre of [false, true]) {
        const puerto = valorDe(entradasPorDefecto('lancha-open', { amarre: 'puerto', eslora, ivaAmarre }), 'amarre')!;
        const seca = valorDe(entradasPorDefecto('lancha-open', { amarre: 'seca', eslora, ivaAmarre }), 'amarre');
        esperarRango(seca, escalar(puerto, FACTOR_MARINA_SECA), `${eslora} m`);
      }
    }
  });

  it('remolque: cantidad fija hasta la eslora máxima con dato, y null por encima', () => {
    for (const eslora of [2.5, REMOLQUE.esloraMaxima - 1, REMOLQUE.esloraMaxima]) {
      esperarRango(
        valorDe(entradasPorDefecto('semirrigida', { amarre: 'remolque', eslora }), 'amarre'),
        exacto(REMOLQUE.eurosAnio),
      );
    }
    for (const eslora of [REMOLQUE.esloraMaxima + 0.5, REMOLQUE.esloraMaxima * 2]) {
      expect(valorDe(entradasPorDefecto('semirrigida', { amarre: 'remolque', eslora }), 'amarre')).toBeNull();
    }
  });

  it('marina privada: el precio anual que indica el usuario; sin precio, null', () => {
    const base = entradasPorDefecto('lancha-cabina', { amarre: 'puerto', modoAmarre: 'privada' });
    expect(valorDe(base, 'amarre')).toBeNull();
    esperarRango(valorDe({ ...base, precioAmarreAnual: 3210 }, 'amarre'), exacto(3210));
  });

  it('puerto público: tarifa × eslora × manga × 365; sin tarifa o sin manga, null', () => {
    const base = entradasPorDefecto('velero-crucero', { amarre: 'puerto', modoAmarre: 'publico', eslora: 9 });
    expect(valorDe(base, 'amarre')).toBeNull();
    expect(valorDe({ ...base, tarifaM2Dia: 0.25 }, 'amarre')).toBeNull();
    expect(valorDe({ ...base, manga: 3 }, 'amarre')).toBeNull();
    esperarRango(valorDe({ ...base, tarifaM2Dia: 0.25, manga: 3 }, 'amarre'), exacto(0.25 * 9 * 3 * 365));
    // Funciona igual para cualquier eslora (no depende de la tabla de rangos).
    const grande = { ...base, eslora: ESLORA_MAX_TABLA + 6, tarifaM2Dia: 0.3, manga: 5 };
    esperarRango(valorDe(grande, 'amarre'), exacto(0.3 * grande.eslora * 5 * 365));
  });

  it('el IVA multiplica el amarre por (1 + IVA) en todos los modos', () => {
    const casos: Partial<EntradasCalculo>[] = [
      { amarre: 'puerto', modoAmarre: 'rango', eslora: 8 },
      { amarre: 'seca', modoAmarre: 'rango', eslora: 6 },
      { amarre: 'puerto', modoAmarre: 'privada', precioAmarreAnual: 4000 },
      { amarre: 'puerto', modoAmarre: 'publico', tarifaM2Dia: 0.2, manga: 2.5, eslora: 7 },
    ];
    for (const c of casos) {
      const sin = valorDe(entradasPorDefecto('lancha-open', { ...c, ivaAmarre: false }), 'amarre')!;
      const con = valorDe(entradasPorDefecto('lancha-open', { ...c, ivaAmarre: true }), 'amarre');
      esperarRango(con, escalar(sin, IVA), JSON.stringify(c));
    }
  });

  it('el remolque no lleva IVA de amarre', () => {
    const e = entradasPorDefecto('moto-agua', { amarre: 'remolque' });
    expect(valorDe({ ...e, ivaAmarre: true }, 'amarre')).toEqual(valorDe(e, 'amarre'));
  });
});

describe('seguro', () => {
  it('sin valor del barco (o con valor 0) no hay estimación', () => {
    for (const tipo of TIPOS) {
      for (const valor of [null, 0]) {
        const d = calcularDesglose(entradasPorDefecto(tipo, { valor }));
        expect(partida(d, 'seguro').valor).toBeNull();
        expect(d.sinDato.map((p) => p.id)).toContain('seguro');
      }
    }
  });

  it('con valor, es el porcentaje de mercado (mín.–máx.) de ese valor', () => {
    for (const valor of [1000, 18_500, 250_000]) {
      esperarRango(
        valorDe(entradasPorDefecto('velero-pequeno', { valor }), 'seguro'),
        escalar(SEGURO_MERCADO.porcentajeValor, valor),
        String(valor),
      );
    }
  });
});

describe('motor y combustible', () => {
  it('sin motor: mantenimiento del motor y combustible valen 0, aunque falten datos', () => {
    for (const tipo of TIPOS) {
      const e = entradasPorDefecto(tipo, {
        motor: 'ninguno',
        horasMotor: null,
        consumoLitrosHora: null,
        precioLitro: null,
      });
      esperarRango(valorDe(e, 'motor'), exacto(0));
      esperarRango(valorDe(e, 'combustible'), exacto(0));
    }
  });

  it('tipo de motor sin indicar: el mantenimiento del motor queda sin dato', () => {
    expect(valorDe(entradasPorDefecto('lancha-open', { motor: null }), 'motor')).toBeNull();
  });

  it('sin horas: una revisión al año × número de motores', () => {
    const casos = [
      ['fueraborda-pequeno', 8, 'fueraborda-pequeno'],
      ['fueraborda-grande', 8, 'fueraborda-grande'],
      ['intraborda', 8, 'intraborda-hasta10'],
      ['intraborda', 10, 'intraborda-hasta10'],
      ['intraborda', 12, 'intraborda-mediano'],
    ] as const;
    for (const [motor, eslora, revision] of casos) {
      for (const numMotores of [1, 2, 3]) {
        const r = REVISION_MOTOR[revision];
        const v = valorDe(entradasPorDefecto('lancha-cabina', { motor, eslora, numMotores }), 'motor');
        esperarRango(v, escalar({ min: r.min, max: r.max }, numMotores), `${motor} ${eslora} m × ${numMotores}`);
        expect(!!v?.abierto, `${motor} abierto`).toBe(r.abierto);
      }
    }
  });

  it('revisiones al año = horas ÷ intervalo del fabricante (mínimo 1)', () => {
    const fb = INTERVALO_REVISION.fueraborda.horas;
    const diesel = INTERVALO_REVISION.intrabordaDiesel.horas;
    const base = (horasMotor: number | null, extra = {}) =>
      entradasPorDefecto('lancha-open', { motor: 'fueraborda-pequeno', horasMotor, ...extra });
    const r = REVISION_MOTOR['fueraborda-pequeno'];
    esperarRango(valorDe(base(fb - 1), 'motor'), exacto(r.min));
    esperarRango(valorDe(base(fb + 1), 'motor'), exacto(r.min * 2));
    esperarRango(valorDe(base(fb * 3), 'motor'), exacto(r.min * 3));
    esperarRango(valorDe(base(0), 'motor'), exacto(r.min));
    // Intraborda diésel: cada 250 h; de gasolina no hay dato de intervalo → 1 revisión.
    const m = REVISION_MOTOR['intraborda-mediano'];
    const intra = (combustible: 'gasolina' | 'gasoleo') =>
      entradasPorDefecto('lancha-cabina', { motor: 'intraborda', eslora: 11, horasMotor: diesel + 1, combustible });
    esperarRango(valorDe(intra('gasoleo'), 'motor'), { min: m.min * 2, max: m.max * 2 });
    esperarRango(valorDe(intra('gasolina'), 'motor'), { min: m.min, max: m.max });
  });

  it('yate grande con dos motores y generador: «3.000 € o más», sin multiplicar por motores', () => {
    const r = REVISION_MOTOR['intraborda-grande'];
    const e = entradasPorDefecto('yate-lujo', { motor: 'intraborda-grande', numMotores: 2, combustible: 'gasoleo' });
    const v = valorDe(e, 'motor');
    esperarRango(v, exacto(r.min));
    expect(v?.abierto).toBe(true);
    expect(textoRango(v!)).toContain('o más');
    // 300 h de diésel → 2 revisiones.
    esperarRango(valorDe({ ...e, horasMotor: 300 }, 'motor'), exacto(r.min * 2));
    // El total hereda el «o más».
    expect(calcularDesglose(e).total.abierto).toBe(true);
  });

  it('combustible = horas × consumo × precio del litro', () => {
    const e = completas('lancha-open', { horasMotor: 80, consumoLitrosHora: 12.5, precioLitro: 1.75 });
    esperarRango(valorDe(e, 'combustible'), exacto(80 * 12.5 * 1.75));
    esperarRango(valorDe({ ...e, horasMotor: 0 }, 'combustible'), exacto(0));
  });

  it('si falta cualquiera de los tres datos, el combustible queda sin dato', () => {
    const e = completas('lancha-open');
    for (const falta of ['horasMotor', 'consumoLitrosHora', 'precioLitro'] as const) {
      const d = calcularDesglose({ ...e, [falta]: null });
      expect(partida(d, 'combustible').valor, falta).toBeNull();
      expect(partida(d, 'combustible').sinDato, falta).toBeTruthy();
    }
  });

  it('tieneMotor: null si no se sabe; false solo sin motor', () => {
    expect(tieneMotor({ motor: null })).toBeNull();
    expect(tieneMotor({ motor: 'ninguno' })).toBe(false);
    expect(tieneMotor({ motor: 'fueraborda-pequeno' })).toBe(true);
    expect(tieneMotor({ motor: 'intraborda-grande' })).toBe(true);
  });
});

describe('antifouling y varada', () => {
  it('sin antifouling si el barco no pasa el año en el agua', () => {
    for (const amarre of FUERA_DEL_AGUA) {
      for (const antifouling of ['profesional', 'diy'] as const) {
        esperarRango(valorDe(entradasPorDefecto('lancha-open', { amarre, antifouling }), 'antifouling'), exacto(0));
      }
    }
  });

  it('en el agua: rango profesional o hecho por uno mismo', () => {
    for (const amarre of EN_EL_AGUA) {
      esperarRango(
        valorDe(entradasPorDefecto('velero-crucero', { amarre, antifouling: 'profesional' }), 'antifouling'),
        ANTIFOULING.profesional,
      );
      esperarRango(
        valorDe(entradasPorDefecto('velero-crucero', { amarre, antifouling: 'diy' }), 'antifouling'),
        ANTIFOULING.hazloTuMismo,
      );
    }
  });

  it('la varada solo cuenta si se marca', () => {
    for (const amarre of AMARRES) {
      esperarRango(valorDe(entradasPorDefecto('lancha-cabina', { amarre, incluirVarada: false }), 'varada'), exacto(0));
      esperarRango(
        valorDe(entradasPorDefecto('lancha-cabina', { amarre, incluirVarada: true }), 'varada'),
        VARADA.dosMeses,
      );
    }
  });
});

describe('inspección (ITB)', () => {
  it('vale 0 cuando la norma no exige reconocimientos periódicos; si los exige, no hay precio (null)', () => {
    for (const lista of [6, 7] as Lista[]) {
      for (const eslora of ESLORAS) {
        const regla = periodicidadPara(lista, eslora);
        const valor = valorDe(entradasPorDefecto('lancha-open', { lista, eslora }), 'itb');
        if (regla && regla.anios === null) esperarRango(valor, exacto(0), `lista ${lista} / ${eslora} m`);
        else expect(valor, `lista ${lista} / ${eslora} m`).toBeNull();
      }
    }
  });

  it('lista 7 y menos de 6 m: sin caducidad (0); a partir de 6 m, sin precio', () => {
    expect(valorDe(entradasPorDefecto('semirrigida', { lista: 7, eslora: 5.5 }), 'itb')).toEqual(exacto(0));
    expect(valorDe(entradasPorDefecto('semirrigida', { lista: 7, eslora: 6 }), 'itb')).toBeNull();
  });
});

describe('ajustes del usuario', () => {
  it('un ajuste sustituye a la estimación con un importe exacto y se marca como editado', () => {
    const e = completas('velero-crucero', { amarre: 'puerto', eslora: 10 });
    const sin = calcularDesglose(e);
    const con = calcularDesglose(e, { amarre: 4321 });
    const amarre = partida(con, 'amarre');
    expect(amarre.valor).toEqual(exacto(4321));
    expect(amarre.editado).toBe(true);
    expect(amarre.estimado).toEqual(partida(sin, 'amarre').estimado);
    const sinAmarre = partida(sin, 'amarre').valor!;
    esperarRango(con.total, { min: sin.total.min - sinAmarre.min + 4321, max: sin.total.max - sinAmarre.max + 4321 });
  });

  it('un ajuste rellena una partida sin dato: entra en el total y sale de sinDato', () => {
    const e = completas('lancha-cabina');
    const sin = calcularDesglose(e);
    const con = calcularDesglose(e, { tasas: 250, imprevistos: 0, itb: 120 });
    expect(partida(con, 'tasas').valor).toEqual(exacto(250));
    expect(partida(con, 'imprevistos').valor).toEqual(exacto(0));
    expect(con.sinDato.map((p) => p.id)).not.toContain('tasas');
    expect(con.sinDato.map((p) => p.id)).not.toContain('imprevistos');
    expect(partida(con, 'tasas').sinDato).toBeUndefined();
    const sumaItbSin = partida(sin, 'itb').valor?.min ?? 0;
    expect(con.total.min).toBeCloseTo(sin.total.min + 250 + 120 - sumaItbSin, 6);
  });

  it('ignora ajustes que no son números finitos y convierte los negativos en 0', () => {
    const e = completas('moto-agua', { amarre: 'remolque' });
    const sin = calcularDesglose(e);
    const d = calcularDesglose(e, { amarre: Number.NaN, seguro: Infinity, combustible: -300, tasas: Number.NaN });
    expect(partida(d, 'amarre')).toEqual(partida(sin, 'amarre'));
    expect(partida(d, 'seguro')).toEqual(partida(sin, 'seguro'));
    expect(partida(d, 'tasas').valor).toBeNull();
    expect(partida(d, 'combustible').valor).toEqual(exacto(0));
    expect(partida(d, 'combustible').editado).toBe(true);
  });
});

describe('regla del sector', () => {
  it('solo con valor y antigüedad "nuevo" o "5-15", como porcentaje del valor', () => {
    const base = completas('velero-crucero', { valor: 80_000 });
    esperarRango(calcularDesglose({ ...base, antiguedad: 'nuevo' }).reglaSector, escalar(REGLA_SECTOR.nuevo, 80_000));
    esperarRango(calcularDesglose({ ...base, antiguedad: '5-15' }).reglaSector, escalar(REGLA_SECTOR.de5a15, 80_000));
    expect(calcularDesglose({ ...base, antiguedad: 'otra' }).reglaSector).toBeNull();
    expect(calcularDesglose({ ...base, antiguedad: null }).reglaSector).toBeNull();
    expect(calcularDesglose({ ...base, valor: null }).reglaSector).toBeNull();
    expect(calcularDesglose({ ...base, valor: 0 }).reglaSector).toBeNull();
  });
});

describe('sanear', () => {
  const base = completas('lancha-open', { amarre: 'puerto', manga: 2.4, tarifaM2Dia: 0.2, precioAmarreAnual: 3000 });
  const opcionales = [
    'manga',
    'horasMotor',
    'consumoLitrosHora',
    'precioLitro',
    'valor',
    'tarifaM2Dia',
    'precioAmarreAnual',
  ] as const;

  it('deja tal cual unas entradas válidas', () => {
    expect(sanear(base)).toEqual(base);
  });

  it('nunca deja NaN: eslora a su valor por defecto y los números opcionales a null (sin dato)', () => {
    for (const malo of [Number.NaN, Infinity, -Infinity]) {
      const sucio = { ...base, eslora: malo, numMotores: malo } as EntradasCalculo;
      for (const k of opcionales) (sucio as unknown as Record<string, unknown>)[k] = malo;
      const s = sanear(sucio);
      expect(s.eslora).toBe(entradasPorDefecto('lancha-open').eslora);
      expect(s.numMotores).toBe(1);
      for (const k of opcionales) expect(s[k], k).toBeNull();
    }
  });

  it('respeta los null (no se inventa ningún dato)', () => {
    const conHuecos = { ...base } as EntradasCalculo;
    for (const k of opcionales) (conHuecos as unknown as Record<string, unknown>)[k] = null;
    const s = sanear(conHuecos);
    for (const k of opcionales) expect(s[k], k).toBeNull();
  });

  it('recorta los valores fuera de límites', () => {
    const bajo = sanear({ ...base, eslora: LIMITES.eslora.min - 1, horasMotor: -10, valor: -1, manga: 0 });
    expect(bajo).toMatchObject({
      eslora: LIMITES.eslora.min,
      horasMotor: LIMITES.horasMotor.min,
      valor: LIMITES.valor.min,
      manga: LIMITES.manga.min,
    });
    const alto = sanear({
      ...base,
      eslora: LIMITES.eslora.max + 1,
      horasMotor: LIMITES.horasMotor.max * 10,
      valor: LIMITES.valor.max * 10,
      precioLitro: LIMITES.precioLitro.max + 1,
    });
    expect(alto).toMatchObject({
      eslora: LIMITES.eslora.max,
      horasMotor: LIMITES.horasMotor.max,
      valor: LIMITES.valor.max,
      precioLitro: LIMITES.precioLitro.max,
    });
  });

  it('número de motores: entero entre 1 y 4', () => {
    expect(sanear({ ...base, numMotores: 0 }).numMotores).toBe(1);
    expect(sanear({ ...base, numMotores: 2.4 }).numMotores).toBe(2);
    expect(sanear({ ...base, numMotores: 9 }).numMotores).toBe(4);
  });

  it('no toca tipo, zona, amarre ni las opciones', () => {
    const s = sanear({ ...base, eslora: Number.NaN });
    for (const k of ['tipo', 'zona', 'amarre', 'modoAmarre', 'motor', 'combustible', 'antifouling', 'lista'] as const) {
      expect(s[k], k).toBe(base[k]);
    }
  });

  it('el desglose sale finito aunque las entradas sean absurdas', () => {
    for (const tipo of TIPOS) {
      const d = calcularDesglose({
        ...completas(tipo),
        eslora: Number.NaN,
        horasMotor: Infinity,
        valor: -1e12,
        numMotores: Number.NaN,
        precioLitro: Number.NaN,
      });
      expect(Number.isFinite(d.total.min) && Number.isFinite(d.total.max), tipo).toBe(true);
      expect(d.partidas.every((p) => p.valor === null || (Number.isFinite(p.valor.min) && p.valor.min >= 0))).toBe(
        true,
      );
    }
  });

  it('el desglose usa las entradas saneadas', () => {
    const e = { ...base, eslora: LIMITES.eslora.max * 3 };
    expect(calcularDesglose(e)).toEqual(calcularDesglose({ ...base, eslora: LIMITES.eslora.max }));
  });
});

describe('textoRango', () => {
  it('un importe exacto se escribe una vez; un rango, con guion', () => {
    expect(textoRango(exacto(300))).toBe(euros(300));
    expect(textoRango({ min: 800, max: 6000 })).toBe(`${euros(800)} – ${euros(6000)}`);
    // Lo que redondea al mismo euro cuenta como exacto.
    expect(textoRango({ min: 299.6, max: 300.4 })).toBe(euros(300));
  });
});
