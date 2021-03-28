module.exports = {
  root: true,
  extends: ['noftalint/typescript'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['node_modules/', 'dist/'],
  reportUnusedDisableDirectives: true,
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  rules: {
    // It cannot resolve TypeScript's path aliases. See https://github.com/mysticatea/eslint-plugin-node/issues/233
    'node/no-missing-import': 'off',

    // @typescript-eslint can't find the `.toString()` method for these types, but it
    // does exists as it is inherited from the `Channel` class.
    '@typescript-eslint/no-base-to-string': ['error', {
      ignoredTypeNames: ['TextChannel', 'NewsChannel'],
    }],

    // We don't necessarily want to use `this` in our class methods (such as `Command#run`),
    // but neither do we want them to be static.
    'class-methods-use-this': 'off',
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
};
