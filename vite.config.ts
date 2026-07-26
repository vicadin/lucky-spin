import { defineConfig } from 'vite';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  root: '.',
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true,
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
  },
  plugins:
    mode === 'analyze'
      ? [
          visualizer({
            filename: 'dist/bundle-report.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
            template: 'treemap',
          }),
        ]
      : [],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    open: false,
  },
}));
