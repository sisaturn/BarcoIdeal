/**
 * Comparación "¿Comprar o alquilar?" (funciones puras), con RANGOS.
 *
 * No hay datos verificados de alquiler ni de amortización: el usuario escribe los suyos.
 * - Tener barco = coste anual (rango) + amortización (valor × % que indique el usuario, opcional).
 * - Alquilar   = días × precio por día + el mismo combustible que gastarías con el tuyo (si se conoce).
 * - Días de equilibrio = a partir de cuántos días al año sale más barato tener barco propio (rango).
 */
import type { Desglose, EntradasCalculo, Rango } from './calculoCostes';

export interface EntradasAlquiler {
  dias: number | null;
  /** € por día sin patrón. null = no indicado. */
  precioSinPatron: number | null;
  /** € por día con patrón. null = no indicado. */
  precioConPatron: number | null;
  /** Pérdida de valor anual como fracción (0,06 = 6 %). null = no se incluye. */
  amortizacion: number | null;
}

export interface OpcionAlquiler {
  precioDia: number;
  /** Coste de alquilar esos días (+ combustible si se conoce). */
  total: number;
  /** Días a partir de los cuales compensa comprar (rango). null en un extremo si pasa de 365. */
  diasEquilibrio: { min: number | null; max: number | null };
}

export interface Comparacion {
  dias: number;
  costeTener: Rango;
  amortizacion: number;
  /** Combustible del desglose (null si no se conoce). */
  combustible: number | null;
  sinPatron: OpcionAlquiler | null;
  conPatron: OpcionAlquiler | null;
}

export function comparar(
  entradas: EntradasCalculo,
  desglose: Desglose,
  alquiler: EntradasAlquiler,
): Comparacion | null {
  if (!alquiler.dias || alquiler.dias <= 0) return null;
  const dias = alquiler.dias;
  const amortizacion = alquiler.amortizacion !== null && entradas.valor ? entradas.valor * alquiler.amortizacion : 0;
  const costeTener: Rango = { min: desglose.total.min + amortizacion, max: desglose.total.max + amortizacion };
  const partidaCombustible = desglose.partidas.find((p) => p.id === 'combustible');
  // El combustible se paga igual con barco propio o alquilado. Si no se conoce, no se suma a ninguno de los dos lados.
  const combustible = partidaCombustible?.valor
    ? (partidaCombustible.valor.min + partidaCombustible.valor.max) / 2
    : null;
  const sinCombustible: Rango = {
    min: Math.max(0, costeTener.min - (combustible ?? 0)),
    max: Math.max(0, costeTener.max - (combustible ?? 0)),
  };

  const opcion = (precio: number | null): OpcionAlquiler | null => {
    if (precio === null || !Number.isFinite(precio) || precio <= 0) return null;
    const equilibrio = (coste: number) => {
      const d = Math.ceil(coste / precio);
      return d <= 365 ? d : null;
    };
    return {
      precioDia: precio,
      total: dias * precio + (combustible ?? 0),
      diasEquilibrio: { min: equilibrio(sinCombustible.min), max: equilibrio(sinCombustible.max) },
    };
  };

  return {
    dias,
    costeTener,
    amortizacion,
    combustible,
    sinPatron: opcion(alquiler.precioSinPatron),
    conPatron: opcion(alquiler.precioConPatron),
  };
}
