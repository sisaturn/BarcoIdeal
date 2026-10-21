import { describe, expect, it } from 'vitest';
import { validarConsentimiento } from '../src/lib/consentimiento';
import { clarityConfigurado } from '../src/lib/clarity';

const ahora = new Date('2026-10-21T12:00:00Z');

describe('validarConsentimiento', () => {
  it('acepta una decisión válida y reciente', () => {
    const c = { analitica: true, fecha: '2026-06-01T10:00:00Z', version: 1 };
    expect(validarConsentimiento(c, ahora)).toEqual(c);
    expect(validarConsentimiento({ ...c, analitica: false }, ahora)?.analitica).toBe(false);
  });

  it('caduca a los 12 meses', () => {
    expect(validarConsentimiento({ analitica: true, fecha: '2025-10-22T12:00:00Z', version: 1 }, ahora)).not.toBeNull();
    expect(validarConsentimiento({ analitica: true, fecha: '2025-10-20T12:00:00Z', version: 1 }, ahora)).toBeNull();
  });

  it('rechaza datos manipulados o de otra versión', () => {
    const malos = [
      null,
      'si',
      [],
      { analitica: 'true', fecha: '2026-06-01T10:00:00Z', version: 1 },
      { analitica: true, fecha: 'ayer', version: 1 },
      { analitica: true, fecha: '2026-06-01T10:00:00Z', version: 2 },
      { analitica: true, fecha: '2030-01-01T00:00:00Z', version: 1 },
      { analitica: true, version: 1 },
    ];
    for (const m of malos) expect(validarConsentimiento(m, ahora), JSON.stringify(m)).toBeNull();
  });
});

describe('clarityConfigurado', () => {
  it('solo acepta ids con letras minúsculas y números', () => {
    expect(clarityConfigurado('abcd1234ef')).toBe(true);
    for (const malo of ['', 'abc', 'ABCD1234EF', 'abc"/><script>', 'abcd 1234', 'a'.repeat(30)]) {
      expect(clarityConfigurado(malo), malo).toBe(false);
    }
  });
});
