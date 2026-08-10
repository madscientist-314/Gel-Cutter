import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  // REPLACE 'gel-cutting-engine' with your exact GitHub repository name!
  base: '/Gel Cutter/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});