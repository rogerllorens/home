import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{mdx,md}",
    "./data/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        lg: "2rem"
      },
      screens: {
        "2xl": "1280px"
      }
    },
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        muted: "var(--color-muted)",
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)"
        },
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
          hover: "var(--color-primary-hover)",
          active: "var(--color-primary-active)"
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)"
        },
        success: {
          DEFAULT: "#22C55E",
          foreground: "#04240F"
        },
        info: {
          DEFAULT: "#60A5FA",
          foreground: "#0B1B33"
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#2A1A03"
        },
        danger: {
          DEFAULT: "#F43F5E",
          foreground: "#2A040B"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans]
      },
      boxShadow: {
        glow: "0 10px 60px -15px rgba(255, 122, 0, 0.45)",
        soft: "0 20px 40px -20px rgba(0,0,0,0.45)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out",
        shimmer: "shimmer 1.5s linear infinite"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
