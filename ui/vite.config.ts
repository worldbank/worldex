import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import eslintPlugin from 'vite-plugin-eslint';
import pluginRewriteAll from 'vite-plugin-rewrite-all';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({
      overlay: { initialIsOpen: false },
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
      },
    }),
    eslintPlugin({
      cache: false,
      include: ['./src/**/*.ts', './src/**/*.tsx'],
      exclude: [
        './src/components/common/**',
        './src/hooks/Auth0.ts',
        './src/utils/formatter.ts',
        './src/utils/htmlForFeature.ts',
        './src/components/views/main/sidebar/**',
        './src/data/sources/source.ts',
        './src/components/views/NotFound.tsx',
      ],
    }),
    viteTsconfigPaths(),
    svgrPlugin(),
    pluginRewriteAll(),
  ],
  build: {
    outDir: 'build',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
  // base: '/worldex',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
    host: true,
    strictPort: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000/',
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
      '/cors-anywhere': {
        target: 'http://localhost:8088/',
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/cors-anywhere/, ''),
        secure: false,
      },
    },
  },
});
