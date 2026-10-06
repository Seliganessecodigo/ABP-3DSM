import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
  {
    files: ['src/**/*.spec.ts'],
    languageOptions: {
      globals: {
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        jest: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
)
