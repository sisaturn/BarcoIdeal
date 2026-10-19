/**
 * Cálculo del coste anual con RANGOS (mínimo–máximo) y huecos explícitos.
 *
 * - Cada partida es una ESTIMACIÓN ORIENTATIVA de mercado (esMercado) que el usuario puede editar.
 * - Si no hay dato verificado para una partida, su valor es null: no se suma al total y se explica
 *   qué falta y dónde consultarlo. Nunca se rellena con una cifra inventada.
 * - Funciones puras (sin estado ni DOM): las usan la calculadora, el recomendador y las fichas.
 */

import { PARTIDAS, TIPOS_AMARRE, type IdAmarre, type IdPartida, type IdZona } from '../data/costes';
import { FACTOR_MARINA_SECA, REMOLQUE, rangoAmarrePara, type RangoAmarre } from '../data/amarres';
import { SEGURO_MERCADO } from '../data/seguro';
import { ANTIFOULING, COMBUSTIBLE, MOTOR, REGLA_SECTOR, VARADA } from '../data/mantenimiento';
import { periodicidadPara, type Lista } from '../data/inspeccion';
import { IVA_NUEVA } from '../data/impuestos';
import type { IdFuente } from '../data/fuentes';
import { TIPOS_BARCO, type IdTipoBarco } from '../data/tiposBarco';
import { euros, num } from './formato';

/** Importe con incertidumbre. Un importe exacto tiene min === max. */
export interface Rango {
  min: number;
  max: number;
}

export type ModoAmarre = 'rango' | 'privada' | 'publico';
export type TipoMotor = 'fueraborda' | 'intraborda' | 'ninguno';
export type TipoCombustible = 'gasolina' | 'gasoleo';
export type Antiguedad = 'nuevo' | '5-15' | 'otra';

export interface EntradasCalculo {
  tipo: IdTipoBarco;
  /** Eslora en metros. */
  eslora: number;
  /** Solo informativa (ejemplos de la zona); no cambia las cifras. */
  zona: IdZona;
  amarre: IdAmarre;
  /** Cómo se calcula el amarre en puerto o marina seca. */
  modoAmarre: ModoAmarre;
  /** Marina privada: precio anual que te dan (€). */
  precioAmarreAnual: number | null;
  /** Puerto público: tarifa en €/m²/día. */
  tarifaM2Dia: number | null;
  /** Manga en metros (para la tarifa por m²). */
  manga: number | null;
  /** Sumar el IVA (21 %) al amarre. */
  ivaAmarre: boolean;
  /** Valor del barco (€). null = no indicado. */
  valor: number | null;
  motor: TipoMotor | null;
  numMotores: number;
  horasMotor: number | null;
  consumoLitrosHora: number | null;
  combustible: TipoCombustible;
  /** Precio del litro (€). null = no indicado. */
  precioLitro: number | null;
  antifouling: 'profesional' | 'diy';
  incluirVarada: boolean;
  lista: Lista;
  antiguedad: Antiguedad | null;
}

/** Valores escritos a mano por el usuario, que sustituyen a la estimación. */
export type Ajustes = Partial<Record<IdPartida, number>>;

export interface PartidaCalculada {
  id: IdPartida;
  nombre: string;
  ayuda: string;
  /** Siempre true: todas las partidas son estimaciones orientativas de mercado. */
  esMercado: true;
  /** Estimación según los datos. null = sin dato. */
  estimado: Rango | null;
  /** Valor final: el ajuste del usuario si lo hay; si no, la estimación. */
  valor: Rango | null;
  editado: boolean;
  /** Cómo se ha calculado, en texto legible. */
  explicacion: string;
  /** Si no hay dato: qué falta y dónde consultarlo. */
  sinDato?: string;
  fuentes: IdFuente[];
}

export interface Desglose {
  partidas: PartidaCalculada[];
  total: Rango;
  mensual: Rango;
  /** Partidas sin dato (no sumadas al total). */
  sinDato: PartidaCalculada[];
  /** Contraste con la regla del sector (amarre + seguro + mantenimiento). null si no aplica. */
  reglaSector: Rango | null;
}

export const LIMITES = {
  eslora: { min: 2, max: 30 },
  manga: { min: 0.5, max: 15 },
  horasMotor: { min: 0, max: 2000 },
  consumo: { min: 0, max: 500 },
  precioLitro: { min: 0, max: 10 },
  valor: { min: 0, max: 50_000_000 },
  tarifaM2Dia: { min: 0, max: 50 },
  precioAmarreAnual: { min: 0, max: 1_000_000 },
} as const;

const exacto = (n: number): Rango => ({ min: n, max: n });
const escalar = (r: Rango, k: number): Rango => ({ min: r.min * k, max: r.max * k });
const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const numeroOpcional = (v: number | null, lim: { min: number; max: number }) =>
  v === null || !Number.isFinite(v) ? null : limitar(v, lim.min, lim.max);

/** Texto de un rango: "800 – 6.000 €" o "300 €" si es exacto. */
export function textoRango(r: Rango): string {
  return Math.round(r.min) === Math.round(r.max) ? euros(r.min) : `${euros(r.min)} – ${euros(r.max)}`;
}

/** ¿Tiene motor este tipo de barco? (para la regla del seguro obligatorio) null = depende. */
export function tieneMotor(e: Pick<EntradasCalculo, 'motor'>): boolean | null {
  if (e.motor === null) return null;
  return e.motor !== 'ninguno';
}

/** Entradas por defecto: solo lo imprescindible. Lo que no sabemos queda en null para que lo indique el usuario. */
export function entradasPorDefecto(tipo: IdTipoBarco, parcial: Partial<EntradasCalculo> = {}): EntradasCalculo {
  const ficha = TIPOS_BARCO[tipo];
  return {
    tipo,
    eslora: ficha.eslora.tipica,
    zona: 'med',
    amarre: ficha.guardado[0],
    modoAmarre: 'rango',
    precioAmarreAnual: null,
    tarifaM2Dia: null,
    manga: null,
    ivaAmarre: false,
    valor: null,
    motor: null,
    numMotores: 1,
    horasMotor: null,
    consumoLitrosHora: null,
    combustible: 'gasolina',
    precioLitro: COMBUSTIBLE.gasolina.eurosLitro,
    antifouling: 'profesional',
    incluirVarada: false,
    lista: 7,
    antiguedad: null,
    ...parcial,
  };
}

/** Normaliza las entradas para que nunca haya valores absurdos o NaN. */
export function sanear(e: EntradasCalculo): EntradasCalculo {
  const def = entradasPorDefecto(e.tipo);
  return {
    ...e,
    eslora: Number.isFinite(e.eslora) ? limitar(e.eslora, LIMITES.eslora.min, LIMITES.eslora.max) : def.eslora,
    manga: numeroOpcional(e.manga, LIMITES.manga),
    horasMotor: numeroOpcional(e.horasMotor, LIMITES.horasMotor),
    consumoLitrosHora: numeroOpcional(e.consumoLitrosHora, LIMITES.consumo),
    precioLitro: numeroOpcional(e.precioLitro, LIMITES.precioLitro),
    valor: numeroOpcional(e.valor, LIMITES.valor),
    tarifaM2Dia: numeroOpcional(e.tarifaM2Dia, LIMITES.tarifaM2Dia),
    precioAmarreAnual: numeroOpcional(e.precioAmarreAnual, LIMITES.precioAmarreAnual),
    numMotores: Number.isFinite(e.numMotores) ? limitar(Math.round(e.numMotores), 1, 4) : 1,
  };
}

type Calculo = { estimado: Rango | null; explicacion: string; sinDato?: string; fuentes: IdFuente[] };

function calcularAmarre(e: EntradasCalculo): Calculo {
  const fuentes: IdFuente[] = ['alcaidesaTarifas', 'euskadiPuertos', 'mallorcaCom', 'araCat'];
  if (e.amarre === 'remolque') {
    if (e.eslora > REMOLQUE.esloraMaxima) {
      return {
        estimado: null,
        explicacion: `Solo hay dato de remolque para esloras de hasta unos ${REMOLQUE.esloraMaxima} m.`,
        sinDato: 'Sin dato de remolque para esta eslora: escribe tu coste (ITV y seguro del remolque, rampas…).',
        fuentes,
      };
    }
    return {
      estimado: exacto(REMOLQUE.eurosAnio),
      explicacion: 'Unos 300 € al año (remolque en casa, hasta ~6 m).',
      fuentes,
    };
  }

  const iva = e.ivaAmarre ? 1 + IVA_NUEVA.tipo : 1;
  const textoIva = e.ivaAmarre ? ' IVA (21 %) incluido.' : ' Sin IVA ni tasas.';

  if (e.modoAmarre === 'privada') {
    if (e.precioAmarreAnual === null) {
      return {
        estimado: null,
        explicacion: 'Marina privada: precio anual cerrado según la eslora.',
        sinDato: 'Escribe la tarifa anual que te da tu marina.',
        fuentes,
      };
    }
    return {
      estimado: exacto(e.precioAmarreAnual * iva),
      explicacion: `Tarifa anual de tu marina.${textoIva}`,
      fuentes,
    };
  }

  if (e.modoAmarre === 'publico') {
    if (e.tarifaM2Dia === null || e.manga === null) {
      return {
        estimado: null,
        explicacion: 'Puerto público: €/m²/día × eslora × manga × 365 días.',
        sinDato: 'Escribe la tarifa por m² y día de tu puerto y la manga del barco.',
        fuentes,
      };
    }
    const anual = e.tarifaM2Dia * e.eslora * e.manga * 365;
    return {
      estimado: exacto(anual * iva),
      explicacion: `${num(e.tarifaM2Dia, 2)} €/m²/día × ${num(e.eslora)} m × ${num(e.manga)} m × 365 días.${textoIva}`,
      fuentes,
    };
  }

  // Modo 'rango': tabla orientativa por eslora.
  const fila: RangoAmarre | null = rangoAmarrePara(e.eslora);
  if (!fila) {
    return {
      estimado: null,
      explicacion: 'La tabla orientativa llega hasta 12 m.',
      sinDato: 'Sin rango orientativo para más de 12 m: consulta las tarifas del puerto (su web o el BOE).',
      fuentes,
    };
  }
  const base: Rango = { min: fila.min, max: fila.max };
  const enSeco = e.amarre === 'seca';
  const rango = escalar(enSeco ? escalar(base, FACTOR_MARINA_SECA) : base, iva);
  let explicacion = `Rango para ${num(fila.eslora)} m: de la zona más barata (Atlántico/Cantábrico) a la más cara (Baleares/Costa Brava).`;
  if (e.eslora < fila.eslora)
    explicacion += ` La tabla solo tiene 6, 8, 10 y 12 m: usamos la fila de ${num(fila.eslora)} m.`;
  if (enSeco) explicacion += ' Marina seca: ~40 % más barata que en el agua.';
  // El rango se elaboró con datos del Atlántico/Cantábrico a Baleares/Costa Brava: no cubre otras zonas.
  if (e.zona === 'can' || e.zona === 'int')
    explicacion += ` Sin datos específicos de ${e.zona === 'can' ? 'Canarias' : 'embalses y ríos'}: es el rango general.`;
  explicacion += textoIva;
  return { estimado: rango, explicacion, fuentes };
}

function calcularPartidas(e: EntradasCalculo): Record<IdPartida, Calculo> {
  const enAgua = TIPOS_AMARRE[e.amarre].enElAgua;

  const seguro: Calculo =
    e.valor === null || e.valor <= 0
      ? {
          estimado: null,
          explicacion:
            'Aproximadamente el 1–2 % del valor del barco al año (todo riesgo: 120–600 €/año en esloras medias).',
          sinDato: 'Indica el valor del barco para estimarlo, o escribe la prima que te ofrezcan.',
          fuentes: SEGURO_MERCADO.fuentes,
        }
      : {
          estimado: {
            min: e.valor * SEGURO_MERCADO.porcentajeValor.min,
            max: e.valor * SEGURO_MERCADO.porcentajeValor.max,
          },
          explicacion: `1–2 % del valor del barco (${euros(e.valor)}). Como referencia, un todo riesgo para esloras medias ronda 120–600 €/año.`,
          fuentes: SEGURO_MERCADO.fuentes,
        };

  const motor: Calculo =
    e.motor === null
      ? {
          estimado: null,
          explicacion: 'Fueraborda: 150–400 €/año. Intraborda: 300–800 €/año (por motor).',
          sinDato: 'Elige el tipo de motor de tu barco.',
          fuentes: MOTOR.fuentes,
        }
      : e.motor === 'ninguno'
        ? { estimado: exacto(0), explicacion: 'Sin motor.', fuentes: MOTOR.fuentes }
        : {
            estimado: escalar(MOTOR[e.motor], e.numMotores),
            explicacion: `${e.motor === 'fueraborda' ? 'Fueraborda: 150–400' : 'Intraborda: 300–800'} € al año por motor${
              e.numMotores > 1 ? ` × ${e.numMotores} motores` : ''
            }.`,
            fuentes: MOTOR.fuentes,
          };

  const antifouling: Calculo = !enAgua
    ? {
        estimado: exacto(0),
        explicacion: 'No incluido: el barco no pasa el año a flote. Si lo necesitas, escribe tu cifra.',
        fuentes: ANTIFOULING.fuentes,
      }
    : e.antifouling === 'diy'
      ? {
          estimado: ANTIFOULING.hazloTuMismo,
          explicacion: 'Hecho por ti: unos 300 € al año (dato del Mediterráneo).',
          fuentes: ANTIFOULING.fuentes,
        }
      : {
          estimado: ANTIFOULING.profesional,
          explicacion:
            'Por un profesional: 600–1.300 € al año (dato del Mediterráneo). Mano de obra de varadero: ~51 €/h.',
          fuentes: [...ANTIFOULING.fuentes, 'alcaidesaVaradero'],
        };

  const varada: Calculo = e.incluirVarada
    ? {
        estimado: VARADA.dosMeses,
        explicacion: 'Unos 2 meses en seco: 200–600 € (0,41–0,55 €/m²/día en Alcaidesa).',
        fuentes: VARADA.fuentes,
      }
    : {
        estimado: exacto(0),
        explicacion: 'No incluida. Márcala si vas a sacar el barco del agua una temporada.',
        fuentes: VARADA.fuentes,
      };

  const faltanCombustible: string[] = [];
  if (e.horasMotor === null) faltanCombustible.push('las horas de motor al año');
  if (e.consumoLitrosHora === null) faltanCombustible.push('el consumo (litros/hora, en la ficha del motor)');
  if (e.precioLitro === null) faltanCombustible.push('el precio del litro en tu puerto');
  const combustible: Calculo =
    e.motor === 'ninguno'
      ? { estimado: exacto(0), explicacion: 'Sin motor.', fuentes: [] }
      : faltanCombustible.length > 0
        ? {
            estimado: null,
            explicacion: 'Horas × consumo × precio del litro.',
            sinDato: `Indica ${faltanCombustible.join(', ')}.`,
            fuentes: [],
          }
        : {
            estimado: exacto(e.horasMotor! * e.consumoLitrosHora! * e.precioLitro!),
            explicacion: `${num(e.horasMotor!, 0)} h × ${num(e.consumoLitrosHora!)} l/h × ${num(e.precioLitro!, 2)} €/l de ${e.combustible}.${
              e.combustible === 'gasolina' && e.precioLitro === COMBUSTIBLE.gasolina.eurosLitro
                ? ' Precio orientativo de gasolina marina: compruébalo en tu puerto.'
                : ''
            }`,
            fuentes: [],
          };

  const regla = periodicidadPara(e.lista, e.eslora);
  const itb: Calculo =
    regla && regla.anios === null
      ? {
          estimado: exacto(0),
          explicacion: `Lista ${e.lista}.ª y menos de 6 m: sin caducidad, no hay reconocimientos periódicos.`,
          fuentes: ['rd1434', 'mitmaInspeccion'],
        }
      : {
          estimado: null,
          explicacion: regla
            ? `Periodicidad legal: ${regla.texto.toLowerCase()}.`
            : 'Consulta la periodicidad para tu caso.',
          sinDato: 'Cada entidad colaboradora fija su precio: pide presupuesto a una de tu zona.',
          fuentes: ['rd1434', 'mitmaInspeccion'],
        };

  const tasas: Calculo = {
    estimado: null,
    explicacion: 'Las tasas (T0, T5…) no están incluidas en los rangos de amarre.',
    sinDato: 'Consulta las tarifas de tu puerto (su web o el BOE).',
    fuentes: [],
  };

  const imprevistos: Calculo = {
    estimado: null,
    explicacion: 'No hay un dato verificado.',
    sinDato: 'Si quieres un colchón para averías, escribe tu propia cifra.',
    fuentes: [],
  };

  return { amarre: calcularAmarre(e), seguro, motor, antifouling, varada, combustible, itb, tasas, imprevistos };
}

/** Calcula el desglose anual. Los `ajustes` del usuario sustituyen a la estimación. */
export function calcularDesglose(entradas: EntradasCalculo, ajustes: Ajustes = {}): Desglose {
  const e = sanear(entradas);
  const calculos = calcularPartidas(e);

  const partidas: PartidaCalculada[] = PARTIDAS.map((meta) => {
    const c = calculos[meta.id];
    const ajuste = ajustes[meta.id];
    const editado = ajuste !== undefined && Number.isFinite(ajuste);
    const valor = editado ? exacto(Math.max(0, ajuste)) : c.estimado;
    return {
      ...meta,
      esMercado: true,
      estimado: c.estimado,
      valor,
      editado,
      explicacion: c.explicacion,
      sinDato: valor === null ? c.sinDato : undefined,
      fuentes: c.fuentes,
    };
  });

  const total = partidas.reduce<Rango>(
    (t, p) => (p.valor ? { min: t.min + p.valor.min, max: t.max + p.valor.max } : t),
    { min: 0, max: 0 },
  );

  const regla =
    e.valor && e.valor > 0 && (e.antiguedad === 'nuevo' || e.antiguedad === '5-15')
      ? escalar(e.antiguedad === 'nuevo' ? REGLA_SECTOR.nuevo : REGLA_SECTOR.de5a15, e.valor)
      : null;

  return {
    partidas,
    total,
    mensual: escalar(total, 1 / 12),
    sinDato: partidas.filter((p) => p.valor === null),
    reglaSector: regla,
  };
}

/** Atajo: rango del coste anual con las entradas dadas (sin ajustes). */
export function costeAnual(entradas: EntradasCalculo): Desglose {
  return calcularDesglose(entradas);
}
