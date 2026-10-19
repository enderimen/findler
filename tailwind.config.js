/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        raleway: ['Raleway', 'sans-serif'],
      },
      container: {
        center: true,
        padding: '1rem',
        screens: {
          '2xl': '1536px',
          'lg': '1440px',
          'xl': '1280px',
          'md': '1024px',
        },
      },
      colors: {
        'gold': '#ddb474',
        'dark-green': '#2a580d',
        'light-black': '#030303',
      },
      borderRadius: {
        'default': '4px',
      },
      height: {
        cover: 'calc(100vh - 83px)'
      },
      zIndex: {
        '-1': '-1',
      }
    },
  },
  plugins: [],
};
