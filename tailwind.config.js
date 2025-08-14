/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Security-themed color palette
        security: {
          primary: '#1e40af',
          secondary: '#3b82f6',
          accent: '#0891b2',
          success: '#047857',
          warning: '#b45309',
          danger: '#b91c1c',
          dark: '#0f172a',
          light: '#f1f5f9',
          border: '#cbd5e1',
          'border-dark': '#475569',
        },
        // Text colors with better contrast
        text: {
          primary: '#1e293b',
          secondary: '#475569',
          muted: '#64748b',
          light: '#94a3b8',
        }
      },
      backgroundImage: {
        'security-gradient-primary': 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        'security-gradient-secondary': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'security-gradient-accent': 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
        'security-gradient-success': 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
        'security-gradient-danger': 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
      },
      animation: {
        'security-pulse': 'security-pulse 2s ease-in-out infinite',
        'security-glow': 'security-glow 2s ease-in-out infinite',
        'security-scan': 'security-scan 2s linear infinite',
        'camera-pulse': 'camera-pulse 2s ease-in-out infinite',
        'processing-dots': 'processing-dots 1.4s infinite',
      },
      keyframes: {
        'security-pulse': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.8',
            transform: 'scale(1.02)',
          },
        },
        'security-glow': {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(30, 64, 175, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(30, 64, 175, 0.6)',
          },
        },
        'security-scan': {
          '0%': {
            backgroundPosition: '-200px 0',
          },
          '100%': {
            backgroundPosition: 'calc(100% + 200px) 0',
          },
        },
        'camera-pulse': {
          '0%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(30, 64, 175, 0.7)',
          },
          '50%': {
            transform: 'scale(1.05)',
            boxShadow: '0 0 0 10px rgba(30, 64, 175, 0)',
          },
          '100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(30, 64, 175, 0)',
          },
        },
        'processing-dots': {
          '0%, 20%': {
            color: 'rgba(30, 64, 175, 0.4)',
            textShadow: '0.25em 0 0 rgba(30, 64, 175, 0.4), 0.5em 0 0 rgba(30, 64, 175, 0.4)',
          },
          '40%': {
            color: 'rgba(30, 64, 175, 0.8)',
            textShadow: '0.25em 0 0 rgba(30, 64, 175, 0.4), 0.5em 0 0 rgba(30, 64, 175, 0.4)',
          },
          '60%': {
            textShadow: '0.25em 0 0 rgba(30, 64, 175, 0.8), 0.5em 0 0 rgba(30, 64, 175, 0.4)',
          },
          '80%, 100%': {
            textShadow: '0.25em 0 0 rgba(30, 64, 175, 0.8), 0.5em 0 0 rgba(30, 64, 175, 0.8)',
          },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'media', // or 'class' for manual dark mode toggle
}
