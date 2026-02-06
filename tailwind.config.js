/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          750: '#1a1f35',
          950: '#0a0e27',
        }
      }
    },
  },
  plugins: [],
}
