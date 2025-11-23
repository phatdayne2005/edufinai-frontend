/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: 'var(--surface-app)',
        card: 'var(--surface-card)',
        elevated: 'var(--surface-elevated)',
        muted: 'var(--surface-muted)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        border: 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          soft: 'var(--color-primary-soft)',
          strong: 'var(--color-primary-strong)',
          glow: 'var(--color-primary-glow)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        elevated: 'var(--shadow-elevated)',
        hover: 'var(--shadow-hover)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      fontFamily: {
        sans: ['var(--font-family-sans)'],
        display: ['var(--font-family-display)'],
      }
    },
  },
  plugins: [],
}

