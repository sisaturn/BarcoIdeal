/**
 * TEXTOS DE LA PÁGINA DE INICIO
 * Cámbialos libremente: los componentes solo leen de aquí.
 */

import { PARTIDAS } from './costes';

export const HERO = {
  antetitulo: 'Para quien busca su primer barco (o el siguiente)',
  titulo: 'Descubre qué barco te conviene y cuánto cuesta de verdad',
  subtitulo:
    'Un test de 10 preguntas para saber qué tipo de barco encaja contigo y una calculadora con todos los gastos del año: amarre, seguro, varada, combustible… sin sorpresas.',
  ctaTest: 'Hacer el test (3 min)',
  ctaCalculadora: 'Calcular el coste anual',
  nota: 'Gratis, sin registro y sin cookies de seguimiento.',
};

export const PASOS = {
  titulo: 'Cómo funciona',
  subtitulo: 'Tres pasos para no equivocarte con una compra que dura años.',
  lista: [
    {
      numero: 1,
      titulo: 'Responde al test',
      texto:
        'Diez preguntas sobre cómo, dónde y con quién quieres navegar. Te digo qué 2 o 3 tipos de barco encajan contigo y por qué.',
      enlace: { texto: 'Hacer el test', href: '/test/' },
    },
    {
      numero: 2,
      titulo: 'Calcula lo que cuesta mantenerlo',
      texto:
        'El precio de compra es solo el principio. La calculadora desglosa los gastos de un año y puedes ajustar cada partida.',
      enlace: { texto: 'Abrir la calculadora', href: '/calculadora/' },
    },
    {
      numero: 3,
      titulo: 'Si quieres, te ayudo a buscarlo',
      texto:
        'Cuéntame qué buscas y te envío 5 opciones reales del mercado en 48 horas, con lo bueno y lo malo de cada una.',
      enlace: { texto: 'Pedir ayuda personalizada', href: '/ayuda/' },
    },
  ],
};

export const TIPOS_SECCION = {
  titulo: '¿Qué tipos de barco comparamos?',
  subtitulo: 'Siete familias que cubren casi todo lo que verás en venta para recreo.',
};

/**
 * SOBRE MÍ — texto de ejemplo. Sustitúyelo por el tuyo.
 */
export const SOBRE_MI = {
  titulo: 'Sobre mí',
  nombre: 'Álvaro Alonso Alejos',
  iniciales: 'AA',
  rol: 'Estudiante de Ingeniería Naval · Universidad Politécnica de Madrid',
  /** Versión corta para la portada. La página completa está en /sobre-mi/. */
  parrafos: [
    'Soy Álvaro Alonso Alejos y estudio Ingeniería Naval en la Universidad Politécnica de Madrid. BarcoIdeal es un proyecto personal de estudiante, no una empresa.',
    'Lo he creado para conocer el sector náutico más allá de lo que veo en clase, conectar con profesionales y aficionados, y echar una mano a quien se plantea comprar su primer barco. Los costes que verás son estimaciones orientativas basadas en datos públicos.',
  ],
  enlace: { texto: 'Conóceme un poco más', href: '/sobre-mi/' },
};

/** Página /sobre-mi/ (versión completa). */
export const SOBRE_MI_PAGINA = {
  subtitulo: 'Un proyecto personal de un estudiante de Ingeniería Naval.',
  quienSoy: 'Me llamo Álvaro Alonso Alejos y estudio Ingeniería Naval en la Universidad Politécnica de Madrid.',
  porQue: {
    titulo: 'Por qué he hecho esta web',
    intro: 'BarcoIdeal nace de tres ganas:',
    razones: [
      'Profundizar en el sector náutico más allá de lo que veo en la universidad: los costes reales, la normativa y cómo se compra un barco de verdad.',
      'Conectar con profesionales y aficionados del mundo de la náutica, y aprender de ellos.',
      'Aportar lo que sé ayudando a quienes se inician en la compra de una embarcación, para que decidan con información clara.',
    ],
  },
  queEs: {
    titulo: 'Lo que es (y lo que no es)',
    puntos: [
      'Es un proyecto personal de un estudiante, no una empresa.',
      'Las estimaciones de coste son orientativas: salen de datos públicos de 2025-2026, pero cada puerto, aseguradora y barco es distinto. Antes de decidir, pide precios concretos.',
      'Los datos legales (titulaciones, seguro obligatorio, inspecciones e impuestos) vienen de la normativa oficial y siempre van enlazados a su fuente.',
      'Si ves un error o un dato desactualizado, te agradeceré mucho que me avises.',
    ],
  },
  contacto: {
    titulo: 'Contacto',
    texto:
      '¿Te dedicas al sector náutico, navegas por afición o estás pensando en comprar un barco? Me encantará leerte.',
  },
};

/**
 * PÁGINA DE AYUDA PERSONALIZADA (/ayuda)
 */
export const AYUDA = {
  titulo: 'Cuéntame qué buscas y te envío 5 opciones en 48 h',
  subtitulo:
    'Rellena el formulario y revisaré el mercado de segunda mano por ti: te mando 5 barcos que encajen con lo que buscas, con lo bueno, lo malo y qué preguntar antes de ir a verlos.',
  // TODO: indica aquí si el servicio es gratuito o de pago y en qué condiciones.
  condiciones: '',
  incluye: [
    '5 opciones reales a la venta que encajen con tu uso y tu presupuesto',
    'Por qué he elegido cada una y qué revisar cuando vayas a verla',
    'Una estimación de lo que te costará mantener cada una al año',
  ],
  exito: {
    titulo: '¡Recibido!',
    texto: 'Gracias por contármelo. En menos de 48 horas te escribiré al email que me has dejado con tus 5 opciones.',
  },
};

export const CTA_FINAL = {
  titulo: '¿Prefieres que alguien te ayude a buscar?',
  texto: 'Cuéntame qué tienes en mente y te envío 5 opciones en 48 horas.',
  boton: 'Quiero ayuda personalizada',
};

/** Cifras destacadas bajo los botones de la portada. */
export const CIFRAS_PORTADA = [
  { valor: '10', texto: 'preguntas en el test' },
  { valor: String(PARTIDAS.length), texto: 'partidas de gasto' },
  { valor: '0', texto: 'cookies de seguimiento' },
];

/** Sección de guías de la portada. */
export const GUIAS = {
  titulo: 'Antes de comprar, infórmate',
  subtitulo: 'Tres guías rápidas que te ahorran disgustos (y dinero).',
  tarjetas: [
    {
      titulo: 'Tipos de barco',
      texto: 'Para quién es cada uno, cuánto cuesta y qué titulación pide.',
      href: '/barcos/',
      enlace: 'Ver los 7 tipos',
    },
    {
      titulo: 'Titulaciones náuticas',
      texto: 'Licencia, PNB, PER… qué barco puedes llevar con cada una y hasta dónde.',
      href: '/titulaciones/',
      enlace: 'Comparar titulaciones',
    },
    {
      titulo: '¿Comprar o alquilar?',
      texto: 'Compara lo que cuesta tener barco con los precios de alquiler de tu zona.',
      href: '/calculadora/#comprar-o-alquilar',
      enlace: 'Hacer la cuenta',
    },
  ],
};
