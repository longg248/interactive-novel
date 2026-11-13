# Task 1: Project Setup & Configuration

## Goal
Initialize a React 18 + TypeScript + Vite project with Tailwind CSS, Zustand, React Query, ESLint, Prettier. Create all config files and entry points. Verify dev server runs.

## Files to Create
- `package.json` - dependencies & scripts
- `tsconfig.json` - strict mode, path aliases
- `tsconfig.node.json` - for Vite config
- `vite.config.ts` - path aliases, build output
- `tailwind.config.js` - custom theme (novel colors, fonts)
- `postcss.config.js` - Tailwind + autoprefixer
- `.eslintrc.cjs` - React + TS rules
- `.prettierrc` - formatting
- `.env.example` - VITE_GEMINI_API_KEY placeholder
- `index.html` - entry HTML
- `src/main.tsx` - React root
- `src/App.tsx` - root component
- `src/vite-env.d.ts` - Vite types

## Exact Values (use verbatim)

### package.json
```json
{
  "name": "interactive-novel",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "format": "prettier --write ."
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.13.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "prettier": "^3.1.1",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tsconfig.node.json
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif JP', 'serif'],
      },
      colors: {
        novel: {
          bg: '#1a1a2e',
          panel: '#16213e',
          accent: '#e94560',
          text: '#eaeaea',
          muted: '#8b8b8b',
        }
      }
    },
  },
  plugins: [],
}
```

### postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### .eslintrc.cjs
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
```

### .prettierrc
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### .env.example
```
VITE_GEMINI_API_KEY=your_api_key_here
```

### index.html
```html
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Interactive Visual Novel</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif+JP:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### src/main.tsx
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### src/App.tsx
```tsx
function App() {
  return <div>App</div>
}

export default App
```

### src/vite-env.d.ts
```typescript
/// <reference types="vite/client" />
```

## Global Constraints (from plan)
- Free tier only: Gemini 1.5 Flash (1,500 req/day, 1M token context)
- No backend - all client-side, static deployment
- Assets self-hosted in `/public/assets/`
- Personal use only - no analytics, auth, payments, multiplayer
- API key in `.env` as `VITE_GEMINI_API_KEY`
- TypeScript strict mode, ESLint + Prettier

## Verification Steps
1. Run `npm install`
2. Run `npx tsc --noEmit` - should pass with no errors
3. Run `npm run dev` - dev server should start at http://localhost:5173
4. Run `npm run build` - should produce `dist/` folder

## Report File
Write report to: `.superpowers/sdd/2026-11-13-interactive-visual-novel/task-1-report.md`

Report format:
```
## Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED

## Commits
- <commit hash> <message>

## Test Summary
- npm install: PASS/FAIL
- tsc --noEmit: PASS/FAIL
- npm run dev: PASS/FAIL (server starts)
- npm run build: PASS/FAIL

## Concerns
- Any issues, deviations, or questions
```