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