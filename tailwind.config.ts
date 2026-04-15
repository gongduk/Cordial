import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/entities/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        mint: {
          50: "#f0fdf9",
          100: "#ccfbee",
          200: "#99f6dc",
          300: "#5eeac5",
          400: "#2dd4a8",
          500: "#14b88d",
          600: "#0d9472",
          700: "#0f765c",
          800: "#115e4a",
          900: "#134e3d",
        },
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
