
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-files',
      closeBundle() {
        // Copy service worker and manifest to dist root
        try {
          copyFileSync('service-worker.js', 'dist/service-worker.js');
          copyFileSync('manifest.json', 'dist/manifest.json');
        } catch (err) {
          console.warn('Could not copy files:', err);
        }
      }
    }
  ],
  // Vite automatically exposes env vars prefixed with VITE_ to client code
  // Access them via import.meta.env.VITE_API_KEY in your code
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep manifest.json at root without hash
          if (assetInfo.name === 'manifest.json') {
            return '[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
  },
});