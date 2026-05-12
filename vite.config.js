import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const isSingleFile = process.env.BUILD_MODE === 'singlefile';

export default defineConfig({
  base: './',
  plugins: isSingleFile ? [viteSingleFile()] : [],
  build: isSingleFile ? {
    outDir: 'dist-html',
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  } : {},
  test: {
    environment: 'node',
  },
});
