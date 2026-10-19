/** Textos derivados de una titulación, SOLO con los datos verificados de titulaciones.ts. */
import type { Titulacion } from '../data/titulaciones';
import { num } from './formato';

/** "Hasta 8 m", "Motor: hasta 5 m · Vela: hasta 6 m" o "Sin dato" si no está indicada. */
export function textoEslora(t: Titulacion): string {
  if (t.esloraMotor === null && t.esloraVela === null) return 'Eslora: sin dato';
  if (t.esloraMotor === t.esloraVela) return `Hasta ${num(t.esloraMotor!)} m`;
  const partes: string[] = [];
  if (t.esloraMotor !== null) partes.push(`Motor: hasta ${num(t.esloraMotor)} m`);
  if (t.esloraVela !== null) partes.push(`Vela: hasta ${num(t.esloraVela)} m`);
  return partes.join(' · ');
}

/** "100 – 200 €" o null si no hay precio orientativo. */
export function textoCosteCurso(t: Titulacion): string | null {
  if (!t.costeCurso) return null;
  return `${num(t.costeCurso.min, 0)} – ${num(t.costeCurso.max, 0)} €`;
}
