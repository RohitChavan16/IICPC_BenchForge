import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        surface: "#0c1220",
        panel: "#111827",
        muted: "#6b7280",
        accent: "#6d28d9",
        accentSoft: "#533483",
        card: "#111827",
      },

      backgroundImage: {
        "radial-glow":
          "radial-gradient(circle at top left, rgba(96,165,250,0.15), transparent 30%), radial-gradient(circle at bottom right, rgba(236,72,153,0.12), transparent 25%)",
      },

      boxShadow: {
        glow: "0 0 60px rgba(99,102,241,0.14)",
      },

      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },

  plugins: [],
};

export default config;