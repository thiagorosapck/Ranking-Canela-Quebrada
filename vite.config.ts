/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// HashRouter + base relativo => funciona em GitHub Pages sem configuração extra.
export default defineConfig({
  base: process.env.VITE_BASE || './',
  plugins: [react()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
