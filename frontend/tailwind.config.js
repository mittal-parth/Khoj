/** @type {import('tailwindcss').Config} */
export default {
content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        'green': '#2d763f',
        'orange': '#ff7208', 
        'yellow': '#c1ac3b',
        'pink': '#ba739b',
        'red': '#d13528',
        'light-green': '#388130',
        'light-yellow': '#ffbb22',
        'light-pink': '#fa5596',
        
      }
    },
  },
  plugins: [],
}
