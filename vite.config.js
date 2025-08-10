import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  server: {
    open: true,
    port: 3000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  optimizeDeps: {
    include: ['three']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true
  }
});
