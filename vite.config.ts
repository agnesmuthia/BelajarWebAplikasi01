/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `base: './'` membuat hasil build bisa dibuka dari subfolder
// (misalnya GitHub Pages: https://username.github.io/nama-repo/).
export default defineConfig({
  base: './',
  // Chunk editor (CodeMirror) ±600 KB, dimuat terpisah hanya di halaman editor.
  build: { chunkSizeWarningLimit: 700 },
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
