/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        cf: {
          newbie: '#808080',
          pupil: '#008000',
          specialist: '#03a89e',
          expert: '#0000ff',
          cm: '#aa00aa',
          master: '#ff8c00',
          im: '#ff8c00',
          gm: '#ff0000',
          igm: '#ff0000',
          legendary: '#ff0000',
        },
      },
    },
  },
  plugins: [],
};
