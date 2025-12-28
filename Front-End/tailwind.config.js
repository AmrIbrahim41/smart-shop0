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
        primary: '#FF6B00',       // البرتقالي
        secondary: '#2A2A2A',     // رمادي غامق
        dark: '#0F172A',          // الكحلي الغامق (الخلفية)
        'dark-accent': '#1E293B', // لون الكروت
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}