/** @type {import('tailwindcss').Config} */
// Palette extracted from the live zoominfo.com (2026): brand red #EA1B15,
// deep navy-indigo #010D39 / #202B52, near-white #F8F9FF, font Inter.
// Token names ("navy"/"coral") are kept stable; values are ZoomInfo's real colors.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ZoomInfo deep navy-indigo (dark rail, headings, text)
        navy: {
          DEFAULT: '#202B52',
          900: '#010D39',
          800: '#0E1A45',
          700: '#202B52',
          600: '#33406E',
          50: '#EEF0F8',
        },
        // ZoomInfo brand red (primary actions, accents) — formerly the wrong orange
        coral: {
          DEFAULT: '#EA1B15',
          600: '#C8120D',
          50: '#FDECEB',
        },
        ink: '#0B1437',
        muted: '#5B6B8C',
        line: '#E3E6F0',
        panel: '#F5F6FC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(1,13,57,0.06), 0 1px 3px rgba(1,13,57,0.10)',
        pop: '0 8px 28px rgba(1,13,57,0.16)',
      },
    },
  },
  plugins: [],
}
