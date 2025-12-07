/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary colour palette
        primary: {
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
        // Lifecycle stage colours
        lifecycle: {
          discovery: '#a855f7', // purple
          development: '#3b82f6', // blue
          production: '#22c55e', // green
          sunset: '#f59e0b', // amber
          retired: '#6b7280', // gray
        },
        // Criticality colours
        criticality: {
          critical: '#ef4444', // red
          high: '#f97316', // orange
          medium: '#eab308', // yellow
          low: '#22c55e', // green
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
