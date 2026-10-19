/**
 * Configuración de Vitest (tests de la lógica pura: recomendador, calculadora, estado y comparador).
 * No usa la configuración de Astro: los módulos probados no dependen de componentes ni de estilos.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
