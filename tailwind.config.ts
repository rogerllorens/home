import type { Config } from 'tailwindcss'
export default {
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme: { extend: { colors: { bg:'#FFF7F8', coral:'#FF4F6D', rose:'#FFE4EA', burgundy:'#7A1E35' } } },
  plugins: []
} satisfies Config
