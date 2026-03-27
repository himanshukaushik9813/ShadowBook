/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}', './hooks/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sb: {
          bg: '#080808',
          panel: 'rgba(18, 14, 11, 0.76)',
          border: 'rgba(255, 255, 255, 0.08)',
          text: '#f5efe7',
          muted: '#a79b90',
          neonGreen: '#ffb36b',
          neonBlue: '#f59e0b',
          neonPurple: '#c88b57',
          danger: '#ff5f7a',
        },
      },
      fontFamily: {
        display: ['Inter', 'Geist', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'Geist', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        sbGlow: '0 0 0 rgba(0, 0, 0, 0)',
        sbBlueGlow: '0 8px 24px rgba(34, 18, 8, 0.14)',
        sbPanel: '0 18px 54px rgba(0, 0, 0, 0.34)',
      },
      keyframes: {
        sbPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.65' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        sbFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        sbLineFlow: {
          '0%': { transform: 'translateX(-6%)' },
          '100%': { transform: 'translateX(104%)' },
        },
        sbGridDrift: {
          '0%': { backgroundPosition: '0 0, 0 0' },
          '100%': { backgroundPosition: '56px 56px, -56px -56px' },
        },
        sbNoise: {
          '0%, 100%': { opacity: '0.06' },
          '50%': { opacity: '0.1' },
        },
      },
      animation: {
        sbPulse: 'sbPulse 2.2s ease-in-out infinite',
        sbFloat: 'sbFloat 4s ease-in-out infinite',
        sbLineFlow: 'sbLineFlow 2s linear infinite',
        sbGridDrift: 'sbGridDrift 12s linear infinite',
        sbNoise: 'sbNoise 2.8s steps(2, end) infinite',
      },
      backdropBlur: {
        sb: '8px',
      },
    },
  },
  plugins: [],
};
