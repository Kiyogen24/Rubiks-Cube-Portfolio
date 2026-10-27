import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.browser },
  },
  {
    // Worker classique : cubejs et mon réseau sont chargés par importScripts, cubejs expose la variable globale Cube
    files: ['js/cube/solver-worker.js', 'js/cube/neural-solver.js'],
    languageOptions: { sourceType: 'script', globals: { ...globals.worker, Cube: 'readonly' } },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.mjs', '*.config.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
  },
];
