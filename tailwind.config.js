/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./client/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#060709",
        canvas:   "#0b0c10",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
