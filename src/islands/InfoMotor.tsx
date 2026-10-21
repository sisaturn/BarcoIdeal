/**
 * Botón (i) junto a «Tipo de motor»: explica de dónde salen las cifras del mantenimiento del motor
 * y qué parte de la fórmula es una suposición. Accesible: botón con aria-expanded y panel enlazado.
 */
import { useState } from 'preact/hooks';
import { FUENTES_MOTOR, INTERVALO_REVISION, MOTOR_GENERAL } from '../data/mantenimiento';
import { num } from '../lib/formato';
import FuenteDato from './FuenteDato';

export default function InfoMotor() {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button
        type="button"
        class="inline-flex size-7 items-center justify-center rounded-full border border-mar-300 text-sm font-bold text-mar-800 hover:bg-mar-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-baliza-500"
        aria-expanded={abierto}
        aria-controls="info-motor"
        aria-label="Cómo se calcula el mantenimiento del motor"
        title="Cómo se calcula el mantenimiento del motor"
        onClick={() => setAbierto((a) => !a)}
      >
        i
      </button>
      {abierto && (
        <div
          id="info-motor"
          class="mt-2 w-full basis-full space-y-2 rounded-lg border border-mar-200 bg-mar-50 p-4 text-sm leading-relaxed text-mar-950"
        >
          <p class="font-bold">Cómo calculamos el mantenimiento del motor</p>
          <p>
            <strong>Fórmula:</strong> revisión anual según el tipo de motor × revisiones al año según las horas de uso ×
            número de motores.
          </p>
          <ul class="list-disc space-y-1 pl-5">
            <li>
              <strong>Las cifras vienen de blogs y prensa náutica, no de datos oficiales.</strong> Por eso se muestran
              como estimación orientativa, con su enlace. Como referencia general, otra fuente da{' '}
              {num(MOTOR_GENERAL.min, 0)}–{num(MOTOR_GENERAL.max, 0)} € al año según el tipo y el estado del motor.
            </li>
            <li>
              <strong>Multiplicar por el número de revisiones es una suposición nuestra:</strong> damos por hecho que
              cada revisión extra cuesta lo mismo que la anual. Las revisiones se cuentan con el intervalo del
              fabricante: cada {num(INTERVALO_REVISION.fueraborda.horas)} h en fuerabordas (Mercury) y cada{' '}
              {num(INTERVALO_REVISION.intrabordaDiesel.horas)} h en intrabordas diésel (Yanmar), con un mínimo de una al
              año. Para intrabordas de gasolina no tenemos el intervalo y contamos una.
            </li>
            <li>
              Cuando la fuente solo da un mínimo («puede superar los 3.000 €»), mostramos «3.000 € o más» y no
              inventamos un máximo.
            </li>
            <li>
              No hemos encontrado fuentes fiables que relacionen el mantenimiento con el consumo o la potencia, así que
              no los usamos.
            </li>
            <li>
              Cada motor es distinto: el intervalo exacto está en su manual, y lo mejor es pedir presupuesto a un
              mecánico. Si lo tienes, escríbelo en la partida «Mantenimiento del motor».
            </li>
          </ul>
          <FuenteDato fuentes={FUENTES_MOTOR} />
        </div>
      )}
    </>
  );
}
