import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';
export default ts.config(
  { ignores: ['dist/**', 'release/**', 'packages/**'] },
  { files: ['desktop/**/*.{ts,tsx}', 'scripts/*.mjs'], extends: [js.configs.recommended, ...ts.configs.recommended], languageOptions: { globals: { ...globals.node, ...globals.browser } }, rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } }
);
