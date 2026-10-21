/**
 * Aviso de cookies. Solo existe si hay un proyecto de Clarity configurado (config.ts).
 * - Sin decisión: se muestra el aviso y Clarity NO se carga.
 * - «Aceptar»: se guarda la decisión y se carga Clarity.
 * - «Rechazar»: se guarda la decisión y no se carga nada (si estaba cargado, se borran sus cookies).
 * Rechazar es igual de fácil que aceptar (mismo nivel, mismo aspecto), como pide la AEPD.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { EVENTO_ABRIR_AVISO, guardarConsentimiento, leerConsentimiento } from '../lib/consentimiento';
import { cargarClarity, retirarClarity } from '../lib/clarity';

export default function AvisoCookies() {
  const [visible, setVisible] = useState(false);
  const refTitulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previo = leerConsentimiento();
    if (previo === null) setVisible(true);
    else if (previo.analitica) cargarClarity();
    const abrir = () => setVisible(true);
    window.addEventListener(EVENTO_ABRIR_AVISO, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_AVISO, abrir);
  }, []);

  useEffect(() => {
    if (visible) refTitulo.current?.focus();
  }, [visible]);

  const decidir = (analitica: boolean) => {
    guardarConsentimiento(analitica);
    if (analitica) cargarClarity();
    else retirarClarity();
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <section
      aria-labelledby="aviso-cookies-titulo"
      class="fixed inset-x-0 bottom-0 z-50 border-t border-mar-200 bg-white/95 shadow-2xl backdrop-blur"
    >
      <div class="contenedor flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div class="max-w-3xl text-sm leading-relaxed text-mar-950">
          <h2 id="aviso-cookies-titulo" ref={refTitulo} tabIndex={-1} class="text-base font-bold outline-none">
            ¿Nos ayudas a mejorar la web?
          </h2>
          <p class="mt-1">
            Con tu permiso usamos <strong>Microsoft Clarity</strong>, que instala cookies de analítica para ver cómo se
            usa la web (clics, desplazamiento, mapas de calor y grabaciones de la sesión). Los campos del formulario no
            se graban. Si rechazas, no se carga nada. Puedes cambiar de opinión cuando quieras en «Configurar cookies»,
            al pie de la página.{' '}
            <a href="/privacidad/#cookies" class="font-semibold text-mar-800 underline underline-offset-2">
              Más información
            </a>
          </p>
        </div>
        <div class="flex shrink-0 gap-3">
          <button type="button" class="btn-primario flex-1 md:flex-none" onClick={() => decidir(false)}>
            Rechazar
          </button>
          <button type="button" class="btn-primario flex-1 md:flex-none" onClick={() => decidir(true)}>
            Aceptar
          </button>
        </div>
      </div>
    </section>
  );
}
