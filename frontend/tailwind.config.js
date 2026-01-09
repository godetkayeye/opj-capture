/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette noir/blanc professionnelle
        'opj-black': '#050505',
        'opj-dark': '#0b0b0f',
        'opj-gray-dark': '#111827',
        'opj-gray': '#1f2933',
        'opj-gray-light': '#9ca3af',
        'opj-border': '#e5e5e5',
      },
    },
  },
  plugins: [],
}

