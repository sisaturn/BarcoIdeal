/**
 * PREGUNTAS DEL TEST "¿QUÉ BARCO ME CONVIENE?"
 * --------------------------------------------
 * - `id` y los `valor` de cada opción aparecen en la URL al compartir el resultado
 *   (p. ej. /test/?uso=pesca&zona=med…), así que conviene que sean cortos y no cambien.
 * - Si cambias un `valor`, actualiza también las reglas de recomendador.ts que lo usan.
 * - El orden del array es el orden en que se preguntan.
 */

export type IdPregunta =
  'uso' | 'zona' | 'personas' | 'dias' | 'compra' | 'anual' | 'titulo' | 'guardado' | 'experiencia' | 'propulsion';

export interface Opcion {
  valor: string;
  etiqueta: string;
  /** Aclaración opcional bajo la etiqueta. */
  detalle?: string;
}

export interface Pregunta {
  id: IdPregunta;
  titulo: string;
  /** Nombre corto para resúmenes ("Uso", "Zona"…). */
  corto: string;
  /** Texto de ayuda bajo el título. */
  ayuda?: string;
  opciones: Opcion[];
}

export const PREGUNTAS: Pregunta[] = [
  {
    id: 'uso',
    titulo: '¿Para qué lo vas a usar sobre todo?',
    corto: 'Uso',
    ayuda: 'Elige el uso principal. Si dudas entre dos, quédate con el que harás más días.',
    opciones: [
      { valor: 'paseo', etiqueta: 'Paseo y baño', detalle: 'Ir a una cala, bañarse, comer a bordo' },
      { valor: 'pesca', etiqueta: 'Pesca', detalle: 'Desde costera hasta curricán' },
      { valor: 'vela', etiqueta: 'Navegar a vela', detalle: 'Lo que te gusta es el viento' },
      { valor: 'deportes', etiqueta: 'Deportes acuáticos', detalle: 'Esquí, wakeboard, hinchables…' },
      { valor: 'travesias', etiqueta: 'Travesías', detalle: 'Ir de un puerto a otro, varios días' },
      { valor: 'vivir', etiqueta: 'Vivir a bordo a ratos', detalle: 'Vacaciones o temporadas en el barco' },
    ],
  },
  {
    id: 'zona',
    titulo: '¿Dónde vas a navegar?',
    corto: 'Zona',
    opciones: [
      {
        valor: 'med',
        etiqueta: 'Costa mediterránea',
        detalle: 'Cataluña, Comunidad Valenciana, Murcia, Andalucía oriental',
      },
      { valor: 'atl', etiqueta: 'Atlántico o Cantábrico', detalle: 'Galicia, Cornisa Cantábrica, Golfo de Cádiz' },
      { valor: 'can', etiqueta: 'Canarias' },
      { valor: 'bal', etiqueta: 'Baleares' },
      { valor: 'int', etiqueta: 'Embalses o ríos' },
    ],
  },
  {
    id: 'personas',
    titulo: '¿Cuántas personas soléis ir normalmente?',
    corto: 'Personas',
    ayuda: 'Piensa en lo habitual, no en el día que venga toda la familia.',
    opciones: [
      { valor: '1-2', etiqueta: '1 o 2 personas' },
      { valor: '3-4', etiqueta: '3 o 4 personas' },
      { valor: '5-6', etiqueta: '5 o 6 personas' },
      { valor: '7+', etiqueta: '7 o más' },
    ],
  },
  {
    id: 'dias',
    titulo: '¿Cuántos días al año crees que saldrás a navegar?',
    corto: 'Días al año',
    ayuda: 'Sé realista: la media de muchos propietarios es bastante más baja de lo que esperaban.',
    opciones: [
      { valor: '<15', etiqueta: 'Menos de 15 días' },
      { valor: '15-40', etiqueta: 'Entre 15 y 40 días', detalle: 'Fines de semana de verano y vacaciones' },
      { valor: '40-80', etiqueta: 'Entre 40 y 80 días', detalle: 'Casi todos los fines de semana de temporada' },
      { valor: '80+', etiqueta: 'Más de 80 días' },
    ],
  },
  {
    id: 'compra',
    titulo: '¿Cuánto quieres gastarte en comprarlo?',
    corto: 'Presupuesto de compra',
    ayuda: 'Precio total del barco, nuevo o de segunda mano.',
    opciones: [
      { valor: '<10', etiqueta: 'Menos de 10.000 €' },
      { valor: '10-30', etiqueta: 'De 10.000 a 30.000 €' },
      { valor: '30-60', etiqueta: 'De 30.000 a 60.000 €' },
      { valor: '60-120', etiqueta: 'De 60.000 a 120.000 €' },
      { valor: '120-300', etiqueta: 'De 120.000 a 300.000 €' },
      { valor: '300-1000', etiqueta: 'De 300.000 a 1 millón de €' },
      { valor: '1000-3000', etiqueta: 'De 1 a 3 millones de €' },
      { valor: '3000+', etiqueta: 'Más de 3 millones de €' },
    ],
  },
  {
    id: 'anual',
    titulo: '¿Cuánto estás dispuesto a gastar al año en mantenerlo?',
    corto: 'Gasto anual',
    ayuda: 'Amarre, seguro, varada, combustible, reparaciones… todo junto.',
    opciones: [
      { valor: '<1.5', etiqueta: 'Menos de 1.500 € al año' },
      { valor: '1.5-4', etiqueta: 'De 1.500 a 4.000 € al año' },
      { valor: '4-8', etiqueta: 'De 4.000 a 8.000 € al año' },
      { valor: '8-15', etiqueta: 'De 8.000 a 15.000 € al año' },
      { valor: '15-40', etiqueta: 'De 15.000 a 40.000 € al año' },
      { valor: '40-100', etiqueta: 'De 40.000 a 100.000 € al año' },
      { valor: '100+', etiqueta: 'Más de 100.000 € al año' },
    ],
  },
  {
    id: 'titulo',
    titulo: '¿Qué titulación náutica tienes o estás dispuesto a sacarte?',
    corto: 'Titulación',
    ayuda: 'Elige la más alta que tengas o que te sacarías sin problema.',
    opciones: [
      { valor: 'ninguna', etiqueta: 'Ninguna, y prefiero no sacarla' },
      { valor: 'licencia', etiqueta: 'Licencia de navegación', detalle: 'Hasta 6 m, 2 millas y de día' },
      { valor: 'pnb', etiqueta: 'Patrón de Navegación Básica (PNB)' },
      { valor: 'per', etiqueta: 'Patrón de Embarcaciones de Recreo (PER)' },
      { valor: 'py', etiqueta: 'Patrón de Yate (PY)' },
      { valor: 'cy', etiqueta: 'Capitán de Yate (CY)' },
    ],
  },
  {
    id: 'guardado',
    titulo: '¿Dónde lo guardarías?',
    corto: 'Dónde guardarlo',
    opciones: [
      { valor: 'puerto', etiqueta: 'Amarre en un puerto o club náutico', detalle: 'El barco está siempre en el agua' },
      { valor: 'seca', etiqueta: 'Marina seca', detalle: 'Te lo guardan en tierra y lo botan cuando vas' },
      { valor: 'remolque', etiqueta: 'En un remolque, en casa', detalle: 'Lo llevas tú a la rampa cada vez' },
      { valor: 'nose', etiqueta: 'Aún no lo sé' },
    ],
  },
  {
    id: 'experiencia',
    titulo: '¿Qué experiencia tienes navegando?',
    corto: 'Experiencia',
    opciones: [
      { valor: 'ninguna', etiqueta: 'Ninguna o casi ninguna' },
      {
        valor: 'alguna',
        etiqueta: 'He salido algunas veces',
        detalle: 'Con amigos, en excursiones o alquileres con patrón',
      },
      {
        valor: 'media',
        etiqueta: 'He llevado barcos alguna vez',
        detalle: 'Alquileres, curso de prácticas, barco de un amigo',
      },
      { valor: 'mucha', etiqueta: 'Mucha', detalle: 'Tengo o he tenido barco, o navego a menudo' },
    ],
  },
  {
    id: 'propulsion',
    titulo: '¿Motor o vela?',
    corto: 'Motor o vela',
    opciones: [
      { valor: 'motor', etiqueta: 'Motor', detalle: 'Llegar rápido y sin complicaciones' },
      { valor: 'vela', etiqueta: 'Vela', detalle: 'Navegar con el viento, sin prisa' },
      { valor: 'igual', etiqueta: 'Me da igual', detalle: 'Recomiéndame lo que mejor encaje' },
    ],
  },
];

/**
 * Días de uso que se pasan a la calculadora según la respuesta a "dias"
 * (para calcular el coste por día de navegación).
 */
export const DIAS_POR_RESPUESTA: Record<string, number> = {
  '<15': 10,
  '15-40': 25,
  '40-80': 60,
  '80+': 100,
};

/** Respuestas del usuario: id de pregunta → valor elegido. */
export type Respuestas = Partial<Record<IdPregunta, string>>;

/** Comprueba que un valor sea una opción válida de una pregunta (útil al leer la URL). */
export function esRespuestaValida(id: IdPregunta, valor: string | null | undefined): boolean {
  const pregunta = PREGUNTAS.find((p) => p.id === id);
  return !!pregunta && !!valor && pregunta.opciones.some((o) => o.valor === valor);
}

/** Devuelve la etiqueta legible de una respuesta (para resúmenes y el formulario). */
export function etiquetaRespuesta(id: IdPregunta, valor: string | undefined): string {
  const pregunta = PREGUNTAS.find((p) => p.id === id);
  return pregunta?.opciones.find((o) => o.valor === valor)?.etiqueta ?? '—';
}
