// Formato español. (No se importa de config.ts para que este módulo sea puro y fácil de probar.)
const LOCALE = 'es-ES';

// Intl en español no agrupa los números de 4 cifras ("1500 €"); con useGrouping: 'always'
// mostramos "1.500 €", que es lo habitual en precios.
const euros0 = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
  useGrouping: 'always',
});

const numero1 = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1, useGrouping: 'always' });
const numero2 = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2, useGrouping: 'always' });

/** 12345.6 → "12.346 €" */
export function euros(valor: number): string {
  return euros0.format(Math.round(valor));
}

/** Redondea a la decena o centena para no dar falsa precisión: 3437 → "3.400 €". */
export function eurosAprox(valor: number): string {
  const paso = valor >= 1000 ? 100 : 10;
  return euros0.format(Math.round(valor / paso) * paso);
}

/** 6.5 → "6,5" · 1500 → "1.500" */
export function num(valor: number, decimales: 0 | 1 | 2 = 1): string {
  if (decimales === 0) return numero1.format(Math.round(valor));
  return (decimales === 1 ? numero1 : numero2).format(valor);
}
