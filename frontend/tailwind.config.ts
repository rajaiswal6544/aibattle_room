import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#080A0F",
        panel: "#10141D",
        panelSoft: "#161B26",
        line: "#283042",
        signal: "#34D399",
        amberSignal: "#F59E0B",
        danger: "#F87171"
      }
    }
  },
  plugins: []
};

export default config;

