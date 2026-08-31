/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1F2420",
        canvas: "#EDE7D3",
        mat: "#7C8F5E",
        belt: "#9C3B28",
        card: "#FAFAF6",
        gold: "#C7A76C",
      },
      fontFamily: {
        display: ["var(--font-barlow)", "sans-serif"],
        body: ["var(--font-karla)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
