import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(), 
    tsconfigPaths(),
  ],
  server: {
    port: 4028,
    open: true,
    strictPort: true,
  },
  preview: {
    port: 4028,
    strictPort: true,
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: resolve(__dirname, 'src')
      },
      {
        find: 'leaflet.css',
        replacement: resolve('node_modules/leaflet/dist/leaflet.css')
      }
    ],
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "leaflet/dist/leaflet.css";`
      }
    }
  }
});
