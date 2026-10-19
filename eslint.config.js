import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['skills/devtools/skill-preflight/scripts/preflight.mjs', 'graphify-out/**', 'node_modules/**', 'coverage/**', 'test/fixtures/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      eqeqeq: ['error', 'always'],
    },
  },
);
