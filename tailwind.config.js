/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{ts,tsx,html}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#1E2530',
        'bg-panel': '#252B33',
        'bg-elevated': '#2D3540',
        'bg-editor': '#161B22',
        border: '#2D3540',
        'border-soft': '#3D4550',
        text: '#E5E7EB',
        'text-muted': '#9CA3AF',
        'text-dim': '#6B7280',
        accent: '#3B82F6',
        'accent-hover': '#2563EB',
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
        mono: ['Cascadia Code', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        base: '14px',
      },
    },
  },
  plugins: [],
}
