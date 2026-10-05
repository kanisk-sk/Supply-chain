import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        slate: {
          50: "#faf7f0",
          100: "#f3eee3",
          200: "#e7dfd0",
          300: "#d5c9b6",
          400: "#a99d8b",
          500: "#7c7264",
          600: "#62594d",
          700: "#4b443b",
          800: "#332f29",
          900: "#211f1b",
          950: "#151411",
        },
        indigo: {
          50: "#edf7ef",
          100: "#d9eddd",
          200: "#b7dbbd",
          300: "#8fc59a",
          400: "#64a874",
          500: "#438b58",
          600: "#337345",
          700: "#2a5d3a",
          800: "#254b31",
          900: "#203e2a",
          950: "#102219",
        },
        blue: {
          50: "#fff8ed",
          100: "#ffefd2",
          200: "#fddca5",
          300: "#f9c875",
          400: "#f2ad4f",
          500: "#e99332",
          600: "#d77925",
          700: "#b45d20",
          800: "#914b20",
          900: "#753f1e",
          950: "#43200e",
        },
        purple: {
          50: "#fff8ed",
          100: "#ffefd2",
          200: "#fddca5",
          700: "#b45d20",
          800: "#914b20",
        },
        emerald: {
          50: "#edf7ef",
          100: "#d9eddd",
          200: "#b7dbbd",
          600: "#337345",
          700: "#2a5d3a",
          800: "#254b31",
        },
      },
    },
  },
  plugins: [],
};
export default config;

