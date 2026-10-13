/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `base: './'` membuat hasil build bisa dibuka dari subfolder
// (misalnya GitHub Pages: https://username.github.io/nama-repo/).
export default defineConfig({
  base: './',
  // Chunk utama ±725 KB (±225 KB gzip) karena memuat seluruh kurikulum untuk menghitung progres;
  // editor CodeMirror & Prettier dimuat terpisah hanya saat dibutuhkan.
  build: { chunkSizeWarningLimit: 800 },
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
