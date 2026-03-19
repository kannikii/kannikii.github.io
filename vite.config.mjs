import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        app: fileURLToPath(new URL('./src/main.jsx', import.meta.url)),
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === 'app' ? 'assets/main.js' : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) =>
          assetInfo.name && assetInfo.name.endsWith('.css')
            ? 'assets/main.css'
            : 'assets/[name]-[hash][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
