/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/hooks/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#8B5CF6' },
        secondary: { DEFAULT: '#6366F1' },
        success: { DEFAULT: '#10B981' },
        danger: { DEFAULT: '#EF4444' },
        warning: { DEFAULT: '#F59E0B' },
        dark: { DEFAULT: '#111827' },
        light: { DEFAULT: '#F3F4F6' },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
