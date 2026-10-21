/**
 * Convierte lo guardado del test y de la calculadora en texto legible,
 * para mostrarlo en el formulario y enviarlo por email (Formspree).
 */
import { PREGUNTAS, etiquetaRespuesta } from '../data/preguntas';
import { TIPOS_BARCO, esTipoBarco } from '../data/tiposBarco';
import { PARTIDAS, TIPOS_AMARRE, ZONAS } from '../data/costes';
import type { EstadoCalculadora, EstadoTest } from './estado';
import { euros, num } from './formato';
import { textoRango } from './calculoCostes';
import { puertoPorId } from '../data/puertos';

export interface LineaResumen {
  etiqueta: string;
  valor: string;
}

export function lineasTest(t: EstadoTest): LineaResumen[] {
  const lineas: LineaResumen[] = PREGUNTAS.map((p) => ({
    etiqueta: p.corto,
    valor: etiquetaRespuesta(p.id, t.respuestas[p.id]),
  }));
  const recomendados = t.recomendados
    .filter(esTipoBarco)
    .map((id) => TIPOS_BARCO[id].nombre)
    .join(', ');
  return [{ etiqueta: 'Recomendados', valor: recomendados || '—' }, ...lineas];
}

export function lineasCalculadora(c: EstadoCalculadora): LineaResumen[] {
  const e = c.entradas;
  const editadas = Object.keys(c.ajustes ?? {})
    .map((id) => PARTIDAS.find((p) => p.id === id)?.nombre)
    .filter(Boolean)
    .join(', ');
  const lineas: LineaResumen[] = [
    { etiqueta: 'Tipo de barco', valor: TIPOS_BARCO[e.tipo]?.nombre ?? e.tipo },
    { etiqueta: 'Eslora', valor: `${num(e.eslora)} m` },
    { etiqueta: 'Zona', valor: ZONAS[e.zona]?.nombre ?? e.zona },
    { etiqueta: 'Dónde lo guarda', valor: TIPOS_AMARRE[e.amarre]?.nombre ?? e.amarre },
    { etiqueta: 'Puerto', valor: puertoPorId(e.puerto ?? null)?.nombre ?? 'Sin elegir' },
    { etiqueta: 'Horas de motor', valor: e.horasMotor === null ? 'Sin indicar' : `${num(e.horasMotor, 0)} h/año` },
    { etiqueta: 'Valor del barco', valor: e.valor === null ? 'Sin indicar' : euros(e.valor) },
    { etiqueta: 'Coste anual orientativo (partidas con dato)', valor: `${textoRango(c.total)}/año` },
  ];
  if (c.diasUso) lineas.push({ etiqueta: 'Días de uso', valor: `${num(c.diasUso, 0)} días/año` });
  if (editadas) lineas.push({ etiqueta: 'Partidas editadas a mano', valor: editadas });
  return lineas;
}

/** Texto plano para el email. */
export const aTexto = (lineas: LineaResumen[]) => lineas.map((l) => `${l.etiqueta}: ${l.valor}`).join('\n');
