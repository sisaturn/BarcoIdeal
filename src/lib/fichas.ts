/**
 * Datos derivados para las fichas de /barcos/ y /titulaciones/.
 * Todo sale de src/data: si cambias una cifra o una regla allí, las fichas se actualizan solas.
 */
import { REGLAS } from '../data/recomendador';
import { etiquetaRespuesta } from '../data/preguntas';
import { LISTA_TIPOS_BARCO, type IdTipoBarco, type TipoBarco } from '../data/tiposBarco';
import {
  LISTA_TITULACIONES,
  TITULACIONES,
  esloraMaximaPara,
  type IdTitulacion,
  type Titulacion,
} from '../data/titulaciones';
import { TIPOS_AMARRE, type IdAmarre } from '../data/costes';
import { costeAnual, entradasPorDefecto, type Rango } from './calculoCostes';
import { num } from './formato';

/** Usos para los que el recomendador da a este tipo +3 o más (ideal) o −3 o menos (mejor evitar). */
export function usosDelTipo(id: IdTipoBarco) {
  const ideal: string[] = [];
  const evitar: string[] = [];
  for (const r of REGLAS) {
    if (r.pregunta !== 'uso') continue;
    const p = r.puntos[id] ?? 0;
    if (p >= 3) ideal.push(etiquetaRespuesta('uso', r.respuesta));
    if (p <= -3) evitar.push(etiquetaRespuesta('uso', r.respuesta));
  }
  return { ideal, evitar };
}

export interface CosteGuardado {
  amarre: IdAmarre;
  nombre: string;
  /** Rango de las partidas con dato. null si no hay ninguna. */
  total: Rango | null;
  /** Nombres de las partidas incluidas. */
  incluye: string[];
  /** true si el amarre no tiene dato para esta eslora (el total es solo mantenimiento). */
  sinAmarre: boolean;
}

/**
 * Coste anual orientativo del tipo (eslora típica) según dónde se guarde.
 * Es PARCIAL: solo partidas con dato verificado sin pedir nada al usuario (amarre y mantenimiento básico).
 */
export function tablaCostes(tipo: TipoBarco): CosteGuardado[] {
  return tipo.guardado.map((amarre) => {
    const d = costeAnual(entradasPorDefecto(tipo.id, { amarre }));
    const incluidas = d.partidas.filter((p) => p.valor && p.valor.max > 0);
    return {
      amarre,
      nombre: TIPOS_AMARRE[amarre].nombre,
      total: incluidas.length > 0 ? d.total : null,
      incluye: incluidas.map((p) => p.nombre.toLowerCase()),
      sinAmarre: !incluidas.some((p) => p.id === 'amarre'),
    };
  });
}

/** true si la eslora típica del tipo supera la última eslora máxima con dato verificado (24 m). */
export function titulacionSinVerificar(tipo: TipoBarco): boolean {
  const maxima = Math.max(
    ...LISTA_TITULACIONES.map((t) => esloraMaximaPara(t, tipo.propulsion)).filter((m): m is number => m !== null),
  );
  return tipo.eslora.tipica > maxima;
}

/** Coste anual parcial de referencia: la forma de guardarlo más habitual. */
export function costeReferencia(tipo: TipoBarco): CosteGuardado {
  return tablaCostes(tipo)[0];
}

/**
 * Notas de titulación de un tipo, generadas SOLO con los datos verificados de titulaciones.ts:
 * qué titulación hace falta según la eslora, dentro del rango de esloras del tipo.
 */
export function notaTitulacion(tipo: TipoBarco): string[] {
  if (tipo.id === 'moto-agua') return ['La Licencia de Navegación habilita para gobernar motos náuticas.'];
  const lineas: string[] = [];
  let ultimoLimite = 0;
  for (const t of LISTA_TITULACIONES) {
    const max = esloraMaximaPara(t, tipo.propulsion);
    if (max === null || max < tipo.eslora.min || max <= ultimoLimite) continue;
    const condicion =
      t.potenciaMaximaKw !== null && tipo.propulsion === 'motor'
        ? ` y motor de hasta ${num(t.potenciaMaximaKw, 2)} kW`
        : '';
    lineas.push(`Hasta ${num(max)} m${condicion}: ${t.nombre}.`);
    ultimoLimite = max;
    if (max >= tipo.eslora.max) break;
  }
  // Por encima de la última eslora con dato no se inventa la titulación: se dice que falta el dato.
  if (ultimoLimite > 0 && tipo.eslora.max > ultimoLimite) {
    lineas.push(
      `Más de ${num(ultimoLimite)} m: los datos verificados no indican la eslora máxima de ninguna titulación de recreo. Confírmalo con la Capitanía Marítima.`,
    );
  }
  return lineas;
}

export interface BarcoParaTitulacion {
  tipo: TipoBarco;
  /** 'completo': cubre los tamaños habituales; 'pequenos': solo las unidades pequeñas. */
  alcance: 'completo' | 'pequenos';
  /** Eslora máxima que permite para este tipo. null = no indicada en los datos verificados. */
  esloraMaxima: number | null;
}

/**
 * Qué tipos de barco se pueden llevar con una titulación (según la titulación mínima y habitual de
 * cada tipo, calculadas con datos verificados). Se asume que cada titulación incluye las de menor nivel.
 */
export function barcosParaTitulacion(id: IdTitulacion): BarcoParaTitulacion[] {
  const tit: Titulacion = TITULACIONES[id];
  return LISTA_TIPOS_BARCO.filter((t) => TITULACIONES[t.titulacionMinima].nivel <= tit.nivel).map((t) => {
    const max = esloraMaximaPara(tit, t.propulsion);
    return {
      tipo: t,
      alcance: TITULACIONES[t.titulacionHabitual].nivel <= tit.nivel ? 'completo' : 'pequenos',
      esloraMaxima: max === null ? null : Math.min(t.eslora.max, max),
    };
  });
}
