/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        terminal: {
          bg:      '#0d1117',
          surface: '#161b22',
          border:  '#30363d',
          green:   '#3fb950',
          blue:    '#58a6ff',
          purple:  '#bc8cff',
          orange:  '#f0883e',
          muted:   '#8b949e',
          text:    '#e6edf3',
        },
      },
    },
  },
  plugins: [],
};
