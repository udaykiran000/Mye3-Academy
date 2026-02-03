/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#E11D48", // Vibrant Rose-Red
          dark: "#1A0505", // Rich Dark Red/Black
          accent: "#FB7185", // Lighter Red for highlights
          soft: "#FFF1F2", // Soft Pinkish-Red Background
        },
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "3rem",
      },
    },
  },
  plugins: [],
};
