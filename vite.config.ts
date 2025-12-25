import { resolve } from 'path';

import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  // Base URL for GitHub Pages deployment
  base: './',

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  // Development server configuration
  server: {
    port: 8080,
    open: true,
    host: true, // Listen on all network interfaces
  },

  // Build configuration
  // Static asset handling
  publicDir: 'public',
  
  // Ensure public files are properly copied
  build: {
    outDir: 'dist',
    sourcemap: true, // Generate source maps for better debugging
    target: 'esnext', // Target modern browsers
    minify: 'esbuild', // Use esbuild for minification
    cssMinify: true, // Minify CSS
    chunkSizeWarningLimit: 1000, // Increase chunk size warning limit
    assetsInlineLimit: 0, // Don't inline any assets (ensures all files are copied)
    copyPublicDir: true, // Copy the public directory to dist
    assetsDir: 'assets', // Output assets to assets directory
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          vendor: ['howler'],
        },
      },
    },
  },

  // Test configuration
  test: {
    globals: true, // Enable global variables for tests
    environment: 'jsdom', // Use JSDOM for DOM testing
    setupFiles: './tests/setup.ts', // Global test setup file
    exclude: [...configDefaults.exclude, '**/node_modules/**'],

    // Coverage configuration
    coverage: {
      enabled: true,
      provider: 'v8', // Use V8's built-in coverage
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/tests/**',
        '**/coverage/**',
        '**/public/**',
        '**/docs/**',
        '**/.*',
        '**/*.config.*',
        '**/vite-env.d.ts',
      ],
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['howler'],
  },

  // Plugin configuration
  plugins: [
    // Add any Vite plugins here as needed
  ],

  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});
