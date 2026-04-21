/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        glow: "glowing 1.5s infinite alternate",
      },
      keyframes: {
        glowing: {
          "0%": { boxShadow: "0 0 5px #3b82f6" },
          "100%": { boxShadow: "0 0 15px #3b82f6, 0 0 30px #3b82f6" },
        },
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
