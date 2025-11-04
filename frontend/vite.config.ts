import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8437,
    host: true,
    proxy: {
      '/api': {
        target: 'http://backend:5829',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://backend:5829',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
