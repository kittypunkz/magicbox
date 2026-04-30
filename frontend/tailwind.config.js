/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        mb: {
          base: '#0f0f10',
          surface: '#161618',
          hover: '#1e1e21',
          active: '#252530',
          border: '#1e1e20',
          primary: '#e8e8e8',
          muted: '#666672',
          accent: '#6366f1',
          'accent-hover': '#4f46e5',
          danger: '#ef4444',
        },
        ch: {
          primary: '#6366f1',
          'primary-active': '#4f46e5',
          'primary-disabled': '#3a3a1f',
          'on-primary': '#0a0a0a',
          canvas: '#0a0a0a',
          'surface-soft': '#121212',
          'surface-card': '#1a1a1a',
          'surface-elevated': '#242424',
          hairline: '#2a2a2a',
          'hairline-strong': '#3a3a3a',
          ink: '#ffffff',
          body: '#cccccc',
          'body-strong': '#e6e6e6',
          muted: '#888888',
          'muted-soft': '#5a5a5a',
          emerald: '#22c55e',
          rose: '#ef4444',
          blue: '#3b82f6',
          warning: '#f59e0b',
        },
        notion: {
          dark: {
            bg: '#0a0a0a',
            sidebar: '#1a1a1a',
            hover: '#242424',
            text: '#e6e6e6',
            gray: '#888888',
            border: '#2a2a2a',
            input: '#1a1a1a',
          }
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
