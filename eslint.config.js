// @ts-check
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  // Global ignores
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**', '**/*.tsbuildinfo'],
  },

  // TypeScript recommended rules for all .ts / .tsx files
  tseslint.configs.recommended,

  // Project-wide rule overrides
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
);
