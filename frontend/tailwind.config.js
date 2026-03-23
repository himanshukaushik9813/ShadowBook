/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}', './hooks/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sb: {
          bg: '#0b0f17',
          panel: 'rgba(10, 17, 30, 0.66)',
          border: 'rgba(117, 190, 232, 0.24)',
          text: '#e4f2ff',
          muted: '#96adc3',
          neonGreen: '#3cffb6',
          neonBlue: '#4fd7ff',
          neonPurple: '#8a7dff',
          danger: '#ff5f7a',
        },
      },
      fontFamily: {
        display: ['Oxanium', 'Sora', 'ui-sans-serif', 'system-ui'],
        body: ['Sora', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        sbGlow: '0 0 30px rgba(60, 255, 182, 0.25)',
        sbBlueGlow: '0 0 26px rgba(79, 215, 255, 0.24)',
        sbPanel: '0 20px 50px rgba(2, 8, 20, 0.42)',
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
        sb: '16px',
      },
    },
  },
  plugins: [],
};
