/** @type {import('tailwindcss').Config} */
// IRON LOG 用 Tailwind 設定（CDN版の tailwind.config と同一内容）
module.exports = {
  darkMode: 'class',
  // index.html 内のHTML属性・JSテンプレート文字列・className代入すべてを走査
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
      },
    },
  },
  plugins: [],
};
