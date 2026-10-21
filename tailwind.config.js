/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{ts,tsx,html}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        rack: 'var(--rack)',
        panel: 'var(--panel)',
        raised: 'var(--panel-raised)',
        well: 'var(--well)',
        seam: 'var(--seam)',
        silk: 'var(--silkscreen)',
        'silk-muted': 'var(--silk-muted)',
        'silk-faint': 'var(--silk-faint)',
        vu: 'var(--vu)',
        'vu-deep': 'var(--vu-deep)',
        'led-red': 'var(--led-red)',
        'led-green': 'var(--led-green)',
      },
      fontFamily: {
        sans: ['"Barlow Semi Condensed"', 'Segoe UI', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
