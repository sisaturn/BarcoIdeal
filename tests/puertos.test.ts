import { describe, expect, it } from 'vitest';
import { PUERTOS, esPuerto, puertoPorId, tarifaPuertoPara } from '../src/data/puertos';
import { ZONAS } from '../src/data/costes';
import { costeAnual, conPuerto, entradasPorDefecto, sanear } from '../src/lib/calculoCostes';
import { validarCalculadora, entradasDesdeURL, urlCalculadora } from '../src/lib/estado';

describe('PUERTOS', () => {
  it('ids únicos, zona válida y web https o null', () => {
    expect(new Set(PUERTOS.map((p) => p.id)).size).toBe(PUERTOS.length);
    for (const p of PUERTOS) {
      expect(Object.hasOwn(ZONAS, p.zona), p.id).toBe(true);
      if (p.web !== null) expect(p.web, p.id).toMatch(/^https:\/\//);
    }
  });

  it('solo Alcaidesa tiene tarifa verificada', () => {
    expect(PUERTOS.filter((p) => p.tarifa).map((p) => p.id)).toEqual(['alcaidesa']);
  });

  it('esPuerto no acepta propiedades heredadas ni valores raros', () => {
    expect(esPuerto('alcaidesa')).toBe(true);
    for (const v of ['toString', 'constructor', '', null, 7, undefined]) expect(esPuerto(v)).toBe(false);
  });
});

describe('tarifaPuertoPara', () => {
  const alcaidesa = puertoPorId('alcaidesa');

  it('usa la fila igual o inmediatamente superior', () => {
    expect(tarifaPuertoPara(alcaidesa, 8, 'motor')?.euros).toBe(2568);
    expect(tarifaPuertoPara(alcaidesa, 9, 'motor')?.euros).toBe(3696);
  });

  it('a 12 m distingue veleros y motor', () => {
    expect(tarifaPuertoPara(alcaidesa, 12, 'vela')?.euros).toBe(4314);
    expect(tarifaPuertoPara(alcaidesa, 12, 'motor')?.euros).toBe(6672);
  });

  it('null por encima de la tabla o sin tarifa verificada', () => {
    expect(tarifaPuertoPara(alcaidesa, 18, 'motor')).toBeNull();
    expect(tarifaPuertoPara(puertoPorId('puerto-banus'), 10, 'motor')).toBeNull();
  });
});

describe('puerto en la calculadora', () => {
  it('con tarifa verificada, el amarre usa la tarifa del puerto', () => {
    const e = conPuerto(entradasPorDefecto('lancha-cabina', { eslora: 10 }), 'alcaidesa');
    expect(e.zona).toBe('med');
    expect(e.modoAmarre).toBe('privada');
    const amarre = costeAnual(e).partidas.find((p) => p.id === 'amarre')!;
    expect(amarre.estimado).toEqual({ min: 3696, max: 3696 });
    expect(amarre.fuentes).toEqual(['alcaidesaTarifas']);
  });

  it('el precio escrito por el usuario manda sobre la tarifa del puerto', () => {
    const e = {
      ...conPuerto(entradasPorDefecto('lancha-cabina', { eslora: 10 }), 'alcaidesa'),
      precioAmarreAnual: 5000,
    };
    expect(costeAnual(e).partidas.find((p) => p.id === 'amarre')!.estimado).toEqual({ min: 5000, max: 5000 });
  });

  it('sin tarifa verificada no se inventa nada: sin dato hasta que el usuario la escribe', () => {
    const e = { ...conPuerto(entradasPorDefecto('yate-lujo'), 'puerto-banus'), modoAmarre: 'privada' as const };
    const amarre = costeAnual(e).partidas.find((p) => p.id === 'amarre')!;
    expect(amarre.estimado).toBeNull();
    expect(amarre.sinDato).toContain('Puerto Banús');
  });

  it('un puerto público pone el modo por m² y día; uno sin datos mantiene el modo', () => {
    expect(conPuerto(entradasPorDefecto('velero-crucero'), 'ports-ib').modoAmarre).toBe('publico');
    expect(conPuerto(entradasPorDefecto('velero-crucero'), 'port-adriano').modoAmarre).toBe('rango');
    expect(conPuerto(entradasPorDefecto('velero-crucero'), 'port-adriano').zona).toBe('bal');
  });

  it('sanear, el estado guardado y la URL descartan puertos desconocidos', () => {
    expect(sanear({ ...entradasPorDefecto('catamaran'), puerto: 'toString' }).puerto).toBeNull();
    const guardado = validarCalculadora({ entradas: { tipo: 'catamaran', puerto: 'inventado' } });
    expect(guardado?.entradas.puerto).toBeNull();
    expect(entradasDesdeURL('?tipo=catamaran&puerto=constructor').entradas.puerto).toBeUndefined();
  });

  it('el puerto viaja en la URL de la calculadora', () => {
    const url = urlCalculadora({ ...entradasPorDefecto('catamaran'), puerto: 'marina-ibiza' });
    expect(url).toContain('puerto=marina-ibiza');
    expect(entradasDesdeURL(url.split('?')[1]).entradas.puerto).toBe('marina-ibiza');
  });
});
