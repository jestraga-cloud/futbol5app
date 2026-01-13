import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        field: {
          light: "#4ade80",
          DEFAULT: "#22c55e",
          dark: "#16a34a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
