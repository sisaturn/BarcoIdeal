/**
 * Tests del comparador "¿Comprar o alquilar?" (src/lib/comparador.ts), con rangos.
 * No hay datos verificados de alquiler ni de amortización: los precios los escribe el usuario, así
 * que aquí se usan precios de ejemplo y se comprueban relaciones, no importes.
 */
import { describe, expect, it } from 'vitest';
import { comparar, type EntradasAlquiler } from '../src/lib/comparador';
import { ALQUILER_DIA } from '../src/data/alquiler';
import { calcularDesglose, entradasPorDefecto, type Desglose, type EntradasCalculo } from '../src/lib/calculoCostes';
import { TIPOS_AMARRE, type IdAmarre } from '../src/data/costes';
import { TIPOS_BARCO, type IdTipoBarco } from '../src/data/tiposBarco';

const TIPOS = Object.keys(TIPOS_BARCO) as IdTipoBarco[];
const AMARRES = Object.keys(TIPOS_AMARRE) as IdAmarre[];

/** Casos con y sin combustible conocido, y con y sin valor del barco. */
const CASOS: { entradas: EntradasCalculo; desglose: Desglose }[] = TIPOS.flatMap((tipo) =>
  AMARRES.flatMap((amarre) =>
    [
      entradasPorDefecto(tipo, { amarre }),
      entradasPorDefecto(tipo, {
        amarre,
        valor: 30_000,
        motor: 'fueraborda-pequeno',
        horasMotor: 40,
        consumoLitrosHora: 8,
        precioLitro: 1.9,
      }),
    ].map((entradas) => ({ entradas, desglose: calcularDesglose(entradas) })),
  ),
);

const PRECIOS: EntradasAlquiler = { dias: 20, precioSinPatron: 250, precioConPatron: 450, amortizacion: null };

/** comparar() con días válidos nunca devuelve null: atajo para no repetir el `!`. */
const comparar2 = (e: EntradasCalculo, d: Desglose, a: Partial<EntradasAlquiler> = {}) =>
  comparar(e, d, { ...PRECIOS, ...a })!;

const combustibleDe = (d: Desglose) => {
  const v = d.partidas.find((p) => p.id === 'combustible')!.valor;
  return v ? (v.min + v.max) / 2 : null;
};

describe('comparar', () => {
  it('sin días de uso no hay comparación', () => {
    const { entradas, desglose } = CASOS[0];
    for (const dias of [null, 0, -5]) expect(comparar(entradas, desglose, { ...PRECIOS, dias })).toBeNull();
  });

  it('sin amortización, tener barco cuesta el rango de la calculadora', () => {
    for (const { entradas, desglose } of CASOS) {
      const c = comparar2(entradas, desglose);
      expect(c.amortizacion).toBe(0);
      expect(c.costeTener).toEqual(desglose.total);
      expect(c.dias).toBe(PRECIOS.dias);
    }
  });

  it('la amortización suma valor × fracción a los dos extremos del rango', () => {
    for (const { entradas, desglose } of CASOS) {
      const sin = comparar2(entradas, desglose);
      const con = comparar2(entradas, desglose, { amortizacion: 0.07 });
      const esperada = entradas.valor ? entradas.valor * 0.07 : 0;
      expect(con.amortizacion).toBeCloseTo(esperada, 9);
      expect(con.costeTener.min - sin.costeTener.min).toBeCloseTo(esperada, 9);
      expect(con.costeTener.max - sin.costeTener.max).toBeCloseTo(esperada, 9);
      // El alquiler no cambia.
      expect(con.sinPatron?.total).toBe(sin.sinPatron?.total);
    }
  });

  it('sin valor del barco, la amortización no suma nada (no se inventa)', () => {
    const entradas = entradasPorDefecto('velero-crucero', { valor: null });
    expect(comparar2(entradas, calcularDesglose(entradas), { amortizacion: 0.1 }).amortizacion).toBe(0);
  });

  it('el combustible es el punto medio de la partida de la calculadora, o null si no se conoce', () => {
    for (const { entradas, desglose } of CASOS) {
      expect(comparar2(entradas, desglose).combustible).toBe(combustibleDe(desglose));
    }
    const entradas = entradasPorDefecto('lancha-open');
    const editado = calcularDesglose(entradas, { combustible: 1234 });
    expect(comparar2(entradas, editado).combustible).toBe(1234);
  });

  it('cada opción usa el precio que indica el usuario; sin precio (o con uno no válido), no hay opción', () => {
    const { entradas, desglose } = CASOS[0];
    const c = comparar2(entradas, desglose);
    expect(c.sinPatron?.precioDia).toBe(PRECIOS.precioSinPatron);
    expect(c.conPatron?.precioDia).toBe(PRECIOS.precioConPatron);
    for (const malo of [null, 0, -10, Number.NaN, Infinity]) {
      const r = comparar2(entradas, desglose, { precioSinPatron: malo });
      expect(r.sinPatron, String(malo)).toBeNull();
      expect(r.conPatron).not.toBeNull();
    }
    const nada = comparar2(entradas, desglose, { precioSinPatron: null, precioConPatron: null });
    expect(nada.sinPatron).toBeNull();
    expect(nada.conPatron).toBeNull();
  });

  it('alquilar = días × precio + combustible (si se conoce); cada día más suma su precio', () => {
    for (const { entradas, desglose } of CASOS) {
      const combustible = combustibleDe(desglose) ?? 0;
      let anterior = -Infinity;
      for (const dias of [1, 10, 11, 30, 100]) {
        const c = comparar2(entradas, desglose, { dias });
        expect(c.sinPatron!.total).toBeCloseTo(dias * PRECIOS.precioSinPatron! + combustible, 9);
        expect(c.sinPatron!.total).toBeGreaterThan(anterior);
        anterior = c.sinPatron!.total;
      }
      const diez = comparar2(entradas, desglose, { dias: 10 }).conPatron!.total;
      const once = comparar2(entradas, desglose, { dias: 11 }).conPatron!.total;
      expect(once - diez).toBeCloseTo(PRECIOS.precioConPatron!, 9);
    }
  });

  it('días de equilibrio: a partir de ese día alquilar sale igual o más caro que tener barco', () => {
    let comprobados = 0;
    for (const { entradas, desglose } of CASOS) {
      for (const amortizacion of [null, 0.05]) {
        for (const precio of [40, 250, 900]) {
          const alquiler = { amortizacion, precioSinPatron: precio };
          const c = comparar2(entradas, desglose, alquiler);
          const total = (dias: number) => comparar2(entradas, desglose, { ...alquiler, dias }).sinPatron!.total;
          const { min, max } = c.sinPatron!.diasEquilibrio;
          for (const [eq, coste] of [
            [min, c.costeTener.min],
            [max, c.costeTener.max],
          ] as const) {
            if (eq === null || eq === 0) continue;
            expect(total(eq)).toBeGreaterThanOrEqual(coste - 1e-6);
            // Con 0 días no hay comparación (null): el día anterior solo se comprueba a partir de 2.
            if (eq > 1) expect(total(eq - 1)).toBeLessThan(coste);
            comprobados++;
          }
          if (min !== null && max !== null) expect(min).toBeLessThanOrEqual(max);
          // Si el extremo bajo ya pasa de 365, el alto también.
          if (min === null) expect(max).toBeNull();
        }
      }
    }
    expect(comprobados).toBeGreaterThan(0);
  });

  it('días de equilibrio: null si pasa de 365, y 365 justo en el límite', () => {
    const entradas = entradasPorDefecto('velero-crucero');
    const desglose = calcularDesglose(entradas);
    const precio = 100;
    const conTotal = (min: number, max: number) =>
      comparar2(entradas, { ...desglose, total: { min, max } }, { precioSinPatron: precio }).sinPatron!.diasEquilibrio;
    expect(conTotal(365 * precio - 0.5, 365 * precio + 1)).toEqual({ min: 365, max: null });
    expect(conTotal(1e9, 2e9)).toEqual({ min: null, max: null });
    expect(conTotal(0, 0)).toEqual({ min: 0, max: 0 });
  });
});

describe('datos de alquiler', () => {
  it('hay una entrada para cada tipo de barco', () => {
    expect(Object.keys(ALQUILER_DIA).sort()).toEqual([...TIPOS].sort());
  });

  it('con patrón no es más barato que sin patrón (cuando hay los dos datos)', () => {
    for (const { sinPatron, conPatron } of Object.values(ALQUILER_DIA)) {
      if (sinPatron !== null && conPatron !== null) expect(conPatron).toBeGreaterThanOrEqual(sinPatron);
    }
  });
});
