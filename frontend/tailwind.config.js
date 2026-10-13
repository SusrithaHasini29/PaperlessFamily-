/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#111111',
        cream: '#FAFAF5',
        white: '#FFFFFF',
        lime: '#C8FF3D',
        pink: '#FF7FA8',
        purple: '#7047F5',
        cyan: '#9FE8F5',
        gray: {
          50: '#FBFBF9',
          100: '#F2F2ED',
          200: '#E9E9E4',
          300: '#D5D5CE',
          400: '#9E9E94',
          500: '#6E6E66',
          600: '#4A4A43',
          700: '#2E2E2A',
          800: '#1C1C19',
          900: '#111111',
        },
        // Semantic mappings to maintain compatibility with existing components
        primary: '#111111',
        'primary-text': '#111111',
        'secondary-text': '#5A5A52',
        background: '#FAFAF5',
        card: '#FFFFFF',
        accent: '#C8FF3D',
        secondary: '#7047F5',
        success: '#22C55E',
        warning: '#FF7FA8',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'neo': '2px 2px 0px #111111',
        'neo-sm': '1px 1px 0px #111111',
        'neo-md': '3px 3px 0px #111111',
        'neo-lg': '4px 4px 0px #111111',
        'neo-xl': '6px 6px 0px #111111',
      },
      borderWidth: {
        '1.5': '1.5px',
        '3': '3px',
      },
    },
  },
  plugins: [],
}
