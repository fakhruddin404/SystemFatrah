import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: "#F3EDE1",
        'warm-white': "#FAF7F1",
        ink: "#2A2420",
        'ink-soft': "#6b6055",
        maroon: "#8B3A3A",
        'maroon-deep': "#6f2c2c",
        gold: "#B8863E",
        line: "rgba(42,36,32,0.12)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
