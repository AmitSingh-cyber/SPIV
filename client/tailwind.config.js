/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#030712",
        secondaryBg: "#0F172A",
        primary: "#00F5FF",
        accent: "#7C3AED",
        glowColor: "#00FFD5",
        success: "#00FF99",
        warning: "#FACC15",
        danger: "#FF4D6D",
        cyberDark: {
          900: "#020617",
          800: "#0f172a",
          700: "#1e293b",
          600: "#334155"
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Space Grotesk", "sans-serif"],
        cyber: ["Orbitron", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        'glow-primary': '0 0 15px rgba(0, 245, 255, 0.4)',
        'glow-accent': '0 0 15px rgba(124, 58, 237, 0.4)',
        'glow-success': '0 0 15px rgba(0, 255, 153, 0.4)',
        'glow-danger': '0 0 15px rgba(255, 77, 109, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'aurora': 'aurora 20s infinite alternate',
      },
      keyframes: {
        aurora: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(50px, 100px) scale(1.2)' },
          '100%': { transform: 'translate(-50px, -50px) scale(0.8)' },
        }
      }
    },
  },
  plugins: [],
}
