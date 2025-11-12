module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true,
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    'no-var': 'error',
  },
  overrides: [
    {
      files: ['app/dashboard/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^(session|UserRole)$'
        }]
      }
    }
  ]
} 