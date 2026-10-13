/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Content-Security-Policy untuk hasil build (tidak dipakai saat `npm run dev` karena Vite
 * membutuhkan WebSocket & skrip inline untuk hot reload). Penjelasan tiap baris: SECURITY.md.
 * Catatan: preview Coding Lab memakai iframe srcdoc yang mewarisi CSP ini, jadi skrip inline
 * harus diizinkan; isolasi preview tetap dijaga oleh sandbox tanpa allow-same-origin.
 */
export const APP_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  "connect-src 'self' https://api.github.com https://*.supabase.co",
  "frame-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ')

function csp(): Plugin {
  return {
    name: 'devstudio-csp',
    apply: 'build',
    transformIndexHtml: (html) => html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${APP_CSP}" />\n    <meta name="referrer" content="strict-origin-when-cross-origin" />`),
  }
}

// `base: './'` membuat hasil build bisa dibuka dari subfolder
// (misalnya GitHub Pages: https://username.github.io/nama-repo/).
export default defineConfig({
  base: './',
  // Setiap halaman dimuat terpisah (lazy). Chunk utama ±595 KB (±190 KB gzip) karena memuat
  // kurikulum untuk menghitung progres; CodeMirror, Prettier, dan SQLite dimuat saat dibutuhkan.
  build: { chunkSizeWarningLimit: 700 },
  plugins: [react(), tailwindcss(), csp()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
