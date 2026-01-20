import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Japanese Ryokan palette
        washi: "hsl(var(--washi-paper))",
        ink: "hsl(var(--sumi-ink))",
        cedar: "hsl(var(--cedar))",
        tatami: "hsl(var(--tatami-beige))",
        moss: {
          DEFAULT: "hsl(var(--moss-garden))",
          light: "hsl(var(--pale-olive))",
        },
        stone: "hsl(var(--stone))",
        matcha: "hsl(var(--matcha-dust))",
        // Rist legacy tokens (mapped to new palette)
        paper: "hsl(var(--paper))",
        sage: {
          DEFAULT: "hsl(var(--sage))",
          light: "hsl(var(--sage-light))",
        },
        "brush-stroke": "hsl(var(--brush-stroke))",
        // Functional colors
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Crimson Pro', 'serif'],
      },
      fontSize: {
        // Type scale based on design system
        'xs': ['12px', { lineHeight: '1.4', letterSpacing: '0.03em' }],
        'sm': ['14px', { lineHeight: '1.5', letterSpacing: '0.02em' }],
        'base': ['16px', { lineHeight: '1.6', letterSpacing: '0.01em' }],
        'lg': ['18px', { lineHeight: '1.4', letterSpacing: '0' }],
        'xl': ['24px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        '2xl': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
      },
      spacing: {
        // 8px grid system
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      maxWidth: {
        'content': '1200px',
        'reading': '680px',
        'sidebar': '280px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "organic-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        "voice-pulse": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--moss-garden) / 0.2)" },
          "100%": { boxShadow: "0 0 0 12px hsl(var(--moss-garden) / 0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "slide-up": "slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "scale-in": "scale-in 0.2s ease-out",
        "organic-pulse": "organic-pulse 2s ease-in-out infinite",
        "voice-pulse": "voice-pulse 1.5s ease-out infinite",
      },
      boxShadow: {
        'subtle': '0 2px 8px hsl(var(--sumi-ink) / 0.04), 0 1px 2px hsl(var(--sumi-ink) / 0.08)',
        'elevated': '0 4px 16px hsl(var(--sumi-ink) / 0.06), 0 2px 4px hsl(var(--sumi-ink) / 0.1)',
        'overlay': '0 8px 32px hsl(var(--sumi-ink) / 0.12), 0 2px 8px hsl(var(--sumi-ink) / 0.08)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
