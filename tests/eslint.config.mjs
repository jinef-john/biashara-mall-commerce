import baseConfig from '../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.test.ts'],
    rules: {
      // These tests inspect other projects' route wiring on purpose, which is
      // exactly what the boundary rule exists to stop everywhere else.
      '@nx/enforce-module-boundaries': 'off',
    },
  },
];
