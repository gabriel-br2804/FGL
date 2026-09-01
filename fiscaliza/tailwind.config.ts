import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#FAFAF8",
          card: "#FFFFFF",
          border: "#E6E7E4",
        },
        navy: {
          950: "#040B18",
          900: "#07142B",
          800: "#0B1E3F",
          700: "#0F2A57",
          600: "#15396F",
        },
        ink: {
          900: "#0B0F14",
          700: "#33383F",
          500: "#5B6470",
          400: "#889099",
          300: "#B8BFC7",
        },
        signal: {
          green: "#0F9D6D",
          greenBg: "#E6F6EF",
          amber: "#E8940C",
          amberBg: "#FCF1DC",
          red: "#D0332F",
          redBg: "#FBE7E6",
          blue: "#1D5FD6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,15,20,0.04), 0 1px 12px rgba(11,15,20,0.05)",
        pop: "0 8px 30px rgba(4,11,24,0.12)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
export default config;
