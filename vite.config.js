import { defineConfig } from 'vite';

// base './' makes dist/ fully relative so it can be served from any static host
// or sub-path (Nginx, GitHub Pages, object storage).
// server.host stays at Vite's default (localhost) so `npm run dev -- --host 0.0.0.0`
// can override it explicitly for LAN / phone access.
export default defineConfig({
  base: './',
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: 'dist',
    target: 'es2019',
    sourcemap: false,
  },
});
