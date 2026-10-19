/**
 * ESTRUCTURA DE LA CALCULADORA DE COSTE ANUAL
 * -------------------------------------------
 * Este archivo NO contiene cifras: solo zonas, formas de guardar el barco, partidas y avisos.
 * Las cifras están en:
 *   - amarres.ts       (precio orientativo de mercado)
 *   - seguro.ts        (dato legal + precio orientativo de mercado)
 *   - mantenimiento.ts (precio orientativo de mercado, combustible)
 *   - inspeccion.ts    (dato legal; precio: null)
 *   - impuestos.ts     (dato legal; pagos únicos)
 */

// ---------------------------------------------------------------------------
// ZONAS (solo informativas: los rangos de amarre cubren de la zona más barata a la más cara)
// ---------------------------------------------------------------------------

/** Los ids coinciden con las respuestas de la pregunta "zona" del test. */
export type IdZona = 'med' | 'atl' | 'can' | 'bal' | 'int';

export const ZONAS: Record<IdZona, { nombre: string }> = {
  med: { nombre: 'Costa mediterránea' },
  atl: { nombre: 'Atlántico o Cantábrico' },
  can: { nombre: 'Canarias' },
  bal: { nombre: 'Baleares' },
  int: { nombre: 'Embalses o ríos' },
};

// ---------------------------------------------------------------------------
// DÓNDE SE GUARDA EL BARCO
// ---------------------------------------------------------------------------

/** Los ids coinciden con las respuestas de la pregunta "guardado" del test. */
export type IdAmarre = 'puerto' | 'seca' | 'remolque';

export const TIPOS_AMARRE: Record<IdAmarre, { nombre: string; descripcion: string; enElAgua: boolean }> = {
  puerto: {
    nombre: 'Amarre en puerto',
    descripcion: 'El barco está siempre en el agua, en un puerto deportivo, una marina o un club náutico.',
    enElAgua: true,
  },
  seca: {
    nombre: 'Marina seca',
    descripcion: 'El barco se guarda en tierra y te lo botan cuando vas.',
    enElAgua: false,
  },
  remolque: {
    nombre: 'Remolque en casa',
    descripcion: 'Lo guardas tú en un remolque y lo llevas a una rampa cada vez que sales.',
    enElAgua: false,
  },
};

// ---------------------------------------------------------------------------
// PARTIDAS DEL DESGLOSE (todas son estimaciones orientativas editables)
// ---------------------------------------------------------------------------

export type IdPartida =
  'amarre' | 'seguro' | 'motor' | 'antifouling' | 'varada' | 'combustible' | 'itb' | 'tasas' | 'imprevistos';

/** Nombre y explicación de cada partida, en el orden en que se muestran. */
export const PARTIDAS: { id: IdPartida; nombre: string; ayuda: string }[] = [
  {
    id: 'amarre',
    nombre: 'Amarre, marina seca o remolque',
    ayuda: 'Lo que pagas por tener el barco guardado todo el año.',
  },
  {
    id: 'seguro',
    nombre: 'Seguro',
    ayuda: 'Prima anual. La responsabilidad civil es obligatoria en muchos casos (ver datos legales).',
  },
  { id: 'motor', nombre: 'Mantenimiento del motor', ayuda: 'Revisión anual del motor o motores.' },
  {
    id: 'antifouling',
    nombre: 'Antifouling',
    ayuda: 'Pintura del casco contra algas y moluscos, para barcos que viven en el agua.',
  },
  { id: 'varada', nombre: 'Varada y estancia en seco', ayuda: 'Sacar el barco del agua unos 2 meses (opcional).' },
  { id: 'combustible', nombre: 'Combustible', ayuda: 'Horas de motor × consumo × precio del litro.' },
  { id: 'itb', nombre: 'Inspección (ITB)', ayuda: 'Reconocimientos periódicos obligatorios según la eslora.' },
  { id: 'tasas', nombre: 'Tasas portuarias', ayuda: 'Tasas como la T0 o la T5, que no van en los rangos de amarre.' },
  { id: 'imprevistos', nombre: 'Imprevistos', ayuda: 'Un colchón para averías. Pon tu propia cifra si quieres.' },
];

/** Cabecera obligatoria de la calculadora. */
export const AVISO_COSTES =
  'Importes orientativos basados en datos públicos 2025-2026. Varían según puerto, zona, temporada y estado del barco. No incluyen IVA salvo indicación.';

/** Gastos que la calculadora NO incluye (se muestran como nota). */
export const NO_INCLUIDO = [
  'Impuestos de compra (pagos únicos): los tienes en «Datos legales».',
  'Impuesto de transmisiones (ITP) en compras de segunda mano: sin dato verificado; depende de cada comunidad autónoma.',
  'Cursos y exámenes de titulación: precio orientativo en la ficha de cada titulación.',
  'Amortización (lo que pierde de valor el barco cada año): sin dato verificado.',
  'Equipamiento extra: electrónica, lona, juguetes acuáticos…',
];

// ---------------------------------------------------------------------------
// VALIDACIÓN (para datos que llegan de la URL o del navegador)
// ---------------------------------------------------------------------------

export const esZona = (v: unknown): v is IdZona => typeof v === 'string' && Object.hasOwn(ZONAS, v);
export const esAmarre = (v: unknown): v is IdAmarre => typeof v === 'string' && Object.hasOwn(TIPOS_AMARRE, v);
export const esPartida = (v: unknown): v is IdPartida => typeof v === 'string' && PARTIDAS.some((p) => p.id === v);
