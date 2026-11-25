import { createRequire } from 'node:module'
const require = createRequire(new URL('../../../frontend/package.json', import.meta.url))
export default {
  plugins: [require('@vitejs/plugin-react').default()],
  server: { proxy: { '/api': { target: 'http://127.0.0.1:4317', changeOrigin: true, rewrite: path => path.replace(/^\/api/, '') } } },
}
