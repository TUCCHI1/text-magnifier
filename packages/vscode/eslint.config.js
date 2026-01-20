import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/', 'node_modules/'],
  },
  {
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      'no-ternary': 'error',
      'func-style': ['error', 'expression'],
      'no-restricted-syntax': [
        'error',
        {
          selector: "VariableDeclaration[kind='let']",
          message: 'let is not allowed. Use const with object mutation instead.',
        },
      ],
    },
  },
);
