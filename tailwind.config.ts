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
                // ═══════════════════════════════════════════════════════════
                // DARK PREMIUM PALETTE
                // ═══════════════════════════════════════════════════════════
                
                // Blacks & Grays
                'black-absolute': '#0B0B0B',
                'black-deep': '#0F0F0F',
                'black-surface': '#141414',
                'black-elevated': '#1A1A1A',
                'gray-border': '#262626',
                'gray-border-subtle': '#1F1F1F',
                
                // Whites & Text
                'white-primary': '#FFFFFF',
                'white-soft': '#F5F5F5',
                'gray-text-secondary': '#BFBFBF',
                'gray-text-muted': '#808080',
                
                // Gold Palette
                gold: {
                    DEFAULT: '#D4AF37',
                    light: '#F2D675',
                    dark: '#B8962E',
                    50: '#FDF9E9',
                    100: '#FAF0C8',
                    200: '#F5E291',
                    300: '#F2D675',
                    400: '#E6C34A',
                    500: '#D4AF37',
                    600: '#B8962E',
                    700: '#9A7B24',
                    800: '#7C611B',
                    900: '#5E4814',
                },

                // System Colors (CSS Variables)
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                    hover: "var(--primary-hover)",
                    active: "var(--primary-active)",
                },
                background: "var(--background)",
                foreground: "var(--foreground)",
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },
                popover: {
                    DEFAULT: "var(--popover)",
                    foreground: "var(--popover-foreground)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--secondary-foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "var(--accent-foreground)",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    foreground: "var(--destructive-foreground)",
                },
                success: "var(--success)",
                warning: "var(--warning)",
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
                overlay: "var(--overlay)",
                // Gold palette for direct access
                gold: {
                    DEFAULT: "#D4AF37",
                    light: "#F2D675",
                    dark: "#B8962E",
                },
                sidebar: {
                    DEFAULT: 'var(--sidebar-background)',
                    foreground: 'var(--sidebar-foreground)',
                    primary: 'var(--sidebar-primary)',
                    'primary-foreground': 'var(--sidebar-primary-foreground)',
                    accent: 'var(--sidebar-accent)',
                    'accent-foreground': 'var(--sidebar-accent-foreground)',
                    border: 'var(--sidebar-border)',
                    ring: 'var(--sidebar-ring)',
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                xl: "calc(var(--radius) + 4px)",
                '2xl': "calc(var(--radius) + 8px)",
                '3xl': "calc(var(--radius) + 12px)",
            },
            boxShadow: {
                // Premium Shadows
                'premium-sm': '0 1px 2px rgba(0, 0, 0, 0.5)',
                'premium-md': '0 4px 6px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)',
                'premium-lg': '0 10px 15px rgba(0, 0, 0, 0.5), 0 4px 6px rgba(0, 0, 0, 0.3)',
                'premium-xl': '0 20px 25px rgba(0, 0, 0, 0.5), 0 10px 10px rgba(0, 0, 0, 0.3)',
                'card': '0 4px 20px rgba(0, 0, 0, 0.4)',
                'card-hover': '0 8px 30px rgba(0, 0, 0, 0.5)',
                // Gold Glows
                'gold-glow': '0 0 20px rgba(212, 175, 55, 0.15)',
                'gold-glow-strong': '0 0 30px rgba(212, 175, 55, 0.25)',
                'gold-glow-subtle': '0 0 15px rgba(212, 175, 55, 0.08)',
                // Combined
                'card-gold': '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 20px rgba(212, 175, 55, 0.15)',
            },
            backgroundImage: {
                // Premium Gradients
                'premium-gradient': 'linear-gradient(180deg, #0F0F0F 0%, #0B0B0B 100%)',
                'gold-gradient': 'linear-gradient(135deg, #F2D675 0%, #D4AF37 50%, #B8962E 100%)',
                'gold-radial': 'radial-gradient(ellipse at center top, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.08) 30%, transparent 70%)',
            },
            animation: {
                'gold-pulse': 'gold-pulse 2s ease-in-out infinite',
                'glow-fade': 'glow-fade 3s ease-in-out infinite',
            },
            keyframes: {
                'gold-pulse': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 175, 55, 0.15)' },
                    '50%': { boxShadow: '0 0 20px 5px rgba(212, 175, 55, 0.25)' },
                },
                'glow-fade': {
                    '0%, 100%': { opacity: '0.5' },
                    '50%': { opacity: '1' },
                },
            },
            backdropBlur: {
                'glass': '12px',
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;
