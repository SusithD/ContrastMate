/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Figma-inspired color palette
                figma: {
                    bg: {
                        primary: '#1e1e1e',
                        secondary: '#2c2c2c',
                        tertiary: '#383838',
                        hover: '#404040'
                    },
                    text: {
                        primary: '#ffffff',
                        secondary: '#b3b3b3',
                        tertiary: '#8c8c8c'
                    },
                    brand: {
                        primary: '#0d99ff',
                        secondary: '#7b61ff',
                        success: '#14ae5c',
                        warning: '#ffcd29',
                        error: '#f24822'
                    },
                    border: {
                        default: '#444444',
                        subtle: '#3a3a3a'
                    }
                }
            },
            fontFamily: {
                inter: ['Inter', 'system-ui', 'sans-serif']
            },
            fontSize: {
                '2xs': ['10px', '14px'],
                xs: ['11px', '16px'],
                sm: ['12px', '18px'],
                base: ['13px', '20px'],
                lg: ['14px', '22px']
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite'
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' }
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' }
                }
            },
            boxShadow: {
                'figma': '0 2px 8px rgba(0, 0, 0, 0.25)',
                'figma-lg': '0 4px 16px rgba(0, 0, 0, 0.3)',
                'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }
        }
    },
    plugins: []
}
