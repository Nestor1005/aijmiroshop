import js from '@eslint/js'
import react from 'eslint-plugin-react'

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        crypto: 'readonly',
        FileReader: 'readonly',
        confirm: 'readonly',
      },
    },
    plugins: { react },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': 'off',
    },
    settings: { react: { version: 'detect' } },
  },
]
