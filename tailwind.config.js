/** @type {import('tailwindcss').Config} */
// Tokens mirror DESIGN.md — pages use these names, never raw hex values.
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./packs/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F5F0E6',
        surface: '#FFFCF6',
        sunk: '#EDE6D7',
        line: { DEFAULT: '#DCD2C0', strong: '#8C806B' },
        ink: { DEFAULT: '#1F1A14', 2: '#4F473C', 3: '#6B6152' },
        primary: { DEFAULT: '#1E3A5F', hover: '#152B47', soft: '#E4E9F0' },
        hero: { from: '#101A2B', to: '#1E3658', text: '#F7F2E8', muted: '#C9C2B4' },
        brass: '#E0B25B',
        violated: { fg: '#A3201B', bg: '#FBEAE7', line: '#D9938A', solid: '#B42318' },
        compliant: { fg: '#1D6340', bg: '#E6F2EA', line: '#7FB896', solid: '#1F6E46' },
        undetermined: { fg: '#7A4B00', bg: '#FAF0D9', line: '#CFA554', solid: '#8A5800' },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'serif'],
        mono: ['var(--font-mono)', 'var(--font-body)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        meta: ['13px', { lineHeight: '1.5' }],
      },
      boxShadow: {
        card: '0 1px 2px rgb(31 26 20 / 0.06), 0 4px 16px rgb(31 26 20 / 0.06)',
      },
      maxWidth: {
        prose: '65ch',
      },
    },
  },
  plugins: [],
};
