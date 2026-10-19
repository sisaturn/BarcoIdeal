/**
 * Tests de las funciones de los datos verificados (src/data/): reglas legales y búsquedas en tablas.
 * Se prueban los límites de cada regla leyendo las constantes, no cifras escritas aquí.
 */
import { describe, expect, it } from 'vitest';
import { RANGOS_AMARRE, rangoAmarrePara } from '../src/data/amarres';
import { SEGURO_LEGAL, seguroObligatorio } from '../src/data/seguro';
import { PERIODICIDAD, periodicidadPara, type Lista } from '../src/data/inspeccion';
import { IEDMT, importeIEDMT } from '../src/data/impuestos';
import { LISTA_TITULACIONES, TITULACIONES, esTitulacion, esloraMaximaPara } from '../src/data/titulaciones';
import { TIPOS_BARCO } from '../src/data/tiposBarco';

describe('rangoAmarrePara', () => {
  const esloras = RANGOS_AMARRE.map((r) => r.eslora);
  const ultima = Math.max(...esloras);

  it('la tabla está ordenada por eslora y cada fila tiene mínimo ≤ máximo', () => {
    expect(esloras).toEqual([...esloras].sort((a, b) => a - b));
    for (const r of RANGOS_AMARRE) expect(r.min).toBeLessThanOrEqual(r.max);
  });

  it('devuelve la fila igual o inmediatamente superior a la eslora', () => {
    for (let eslora = 1; eslora <= ultima; eslora += 0.25) {
      const fila = rangoAmarrePara(eslora);
      expect(fila, `${eslora} m`).not.toBeNull();
      expect(fila!.eslora).toBeGreaterThanOrEqual(eslora);
      // No hay ninguna fila más pequeña que también cubra esa eslora.
      expect(RANGOS_AMARRE.some((r) => r.eslora >= eslora && r.eslora < fila!.eslora)).toBe(false);
    }
  });

  it('en una eslora exacta de la tabla devuelve esa fila', () => {
    for (const r of RANGOS_AMARRE) expect(rangoAmarrePara(r.eslora)).toEqual(r);
  });

  it('por encima de la última fila no hay dato', () => {
    expect(rangoAmarrePara(ultima + 0.01)).toBeNull();
    expect(rangoAmarrePara(ultima * 3)).toBeNull();
  });
});

describe('seguroObligatorio', () => {
  const limite = SEGURO_LEGAL.esloraObligatoriaSinMotor;

  it('con motor siempre es obligatorio', () => {
    for (const eslora of [2, limite, limite + 5]) expect(seguroObligatorio(true, eslora)).toBe(true);
  });

  it('sin motor, solo por encima (estrictamente) de la eslora límite', () => {
    expect(seguroObligatorio(false, limite - 1)).toBe(false);
    expect(seguroObligatorio(false, limite)).toBe(false);
    expect(seguroObligatorio(false, limite + 0.01)).toBe(true);
  });
});

describe('periodicidadPara', () => {
  it('cada regla se aplica desde su eslora inicial', () => {
    for (const r of PERIODICIDAD) expect(periodicidadPara(r.lista, r.esloraDesde)).toEqual(r);
  });

  it('respeta si el límite superior se incluye o no', () => {
    for (const r of PERIODICIDAD) {
      const enLimite = periodicidadPara(r.lista, r.esloraHasta);
      if (r.hastaExclusivo) expect(enLimite).not.toEqual(r);
      else expect(enLimite).toEqual(r);
    }
  });

  it('las reglas de una misma lista no se solapan', () => {
    for (const lista of [6, 7] as Lista[]) {
      for (let eslora = 0; eslora <= 30; eslora += 0.5) {
        const aplicables = PERIODICIDAD.filter(
          (r) =>
            r.lista === lista &&
            eslora >= r.esloraDesde &&
            (r.hastaExclusivo ? eslora < r.esloraHasta : eslora <= r.esloraHasta),
        );
        expect(aplicables.length, `lista ${lista} / ${eslora} m`).toBeLessThanOrEqual(1);
        expect(periodicidadPara(lista, eslora)).toEqual(aplicables[0] ?? null);
      }
    }
  });

  it('lista 7 por debajo de 6 m: sin caducidad (anios null)', () => {
    expect(periodicidadPara(7, 5.9)?.anios).toBeNull();
    expect(periodicidadPara(7, 6)?.anios).not.toBeNull();
  });
});

describe('importeIEDMT', () => {
  const limite = IEDMT.esloraMayorQue;

  it('exento hasta la eslora límite incluida', () => {
    expect(importeIEDMT(100_000, limite - 2)).toBe(0);
    expect(importeIEDMT(100_000, limite)).toBe(0);
  });

  it('por encima, el tipo del impuesto sobre el valor', () => {
    for (const valor of [10_000, 123_456]) {
      expect(importeIEDMT(valor, limite + 0.01)).toBeCloseTo(valor * IEDMT.tipo, 6);
      expect(importeIEDMT(valor, limite + 10)).toBeCloseTo(valor * IEDMT.tipo, 6);
    }
  });
});

describe('titulaciones', () => {
  it('los niveles van de 0 en adelante, sin huecos ni repetidos', () => {
    expect(LISTA_TITULACIONES.map((t) => t.nivel)).toEqual(LISTA_TITULACIONES.map((_, i) => i));
  });

  it('cada titulación permite al menos la misma eslora que la anterior (null = sin límite)', () => {
    for (const propulsion of ['motor', 'vela'] as const) {
      const maximos = LISTA_TITULACIONES.map((t) => esloraMaximaPara(t, propulsion) ?? Infinity);
      expect(maximos).toEqual([...maximos].sort((a, b) => a - b));
    }
  });

  it('esloraMaximaPara elige la eslora de motor o de vela', () => {
    for (const t of LISTA_TITULACIONES) {
      expect(esloraMaximaPara(t, 'motor')).toBe(t.esloraMotor);
      expect(esloraMaximaPara(t, 'vela')).toBe(t.esloraVela);
    }
  });

  it('esTitulacion solo acepta ids propios', () => {
    for (const id of Object.keys(TITULACIONES)) expect(esTitulacion(id)).toBe(true);
    for (const malo of ['toString', 'constructor', '__proto__', 'PER', '', null, 3]) {
      expect(esTitulacion(malo), String(malo)).toBe(false);
    }
  });
});

describe('titulación mínima y habitual de cada tipo (calculadas)', () => {
  const cubre = (id: keyof typeof TITULACIONES, eslora: number, propulsion: 'motor' | 'vela') => {
    const max = esloraMaximaPara(TITULACIONES[id], propulsion);
    return max === null || max >= eslora;
  };

  it('la mínima cubre la eslora mínima del tipo y la habitual, la típica', () => {
    for (const tipo of Object.values(TIPOS_BARCO)) {
      expect(cubre(tipo.titulacionMinima, tipo.eslora.min, tipo.propulsion), tipo.id).toBe(true);
      expect(cubre(tipo.titulacionHabitual, tipo.eslora.tipica, tipo.propulsion), tipo.id).toBe(true);
      expect(TITULACIONES[tipo.titulacionMinima].nivel).toBeLessThanOrEqual(
        TITULACIONES[tipo.titulacionHabitual].nivel,
      );
    }
  });

  it('son las de menor nivel que lo cubren (salvo la excepción documentada de la moto de agua)', () => {
    for (const tipo of Object.values(TIPOS_BARCO)) {
      if (tipo.id === 'moto-agua') continue;
      const menores = (id: keyof typeof TITULACIONES) =>
        LISTA_TITULACIONES.filter((t) => t.nivel < TITULACIONES[id].nivel);
      for (const t of menores(tipo.titulacionMinima)) {
        expect(cubre(t.id, tipo.eslora.min, tipo.propulsion), `${tipo.id} / ${t.id}`).toBe(false);
      }
      for (const t of menores(tipo.titulacionHabitual)) {
        expect(cubre(t.id, tipo.eslora.tipica, tipo.propulsion), `${tipo.id} / ${t.id}`).toBe(false);
      }
    }
  });
});
