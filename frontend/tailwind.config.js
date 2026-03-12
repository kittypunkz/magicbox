/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        notion: {
          // Light mode
          bg: '#ffffff',
          sidebar: '#f7f6f3',
          hover: '#efefef',
          text: '#37352f',
          gray: '#9ca3af',
          border: '#e5e5e5',
          // Dark mode
          dark: {
            bg: '#191919',
            sidebar: '#202020',
            hover: '#2a2a2a',
            text: '#e6e6e6',
            gray: '#6b6b6b',
            border: '#2f2f2f',
            input: '#2a2a2a',
          }
        }
      },
    },
  },
  plugins: [],
}
