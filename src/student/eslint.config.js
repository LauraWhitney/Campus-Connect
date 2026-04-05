import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'

// Ignore build output globally
globalIgnores(['dist', 'node_modules'])

export default defineConfig([
  {
    files: ['**/*.{js,ts,jsx,tsx}'],

    // Use recommended JS rules
    extends: [js.configs.recommended],

    // Specify environments and globals
    languageOptions: {
      env: {
        browser: true, // browser globals like window, URL
        node: true,    // Node globals like process
        es2022: true,  // modern JS features
      },
      globals: {
        URL: 'readonly', // explicitly tell ESLint that URL exists
      },
    },
  },
])