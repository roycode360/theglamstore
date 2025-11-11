import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    process.env.ANALYZE === 'true'
      ? visualizer({
          filename: 'dist/bundle-analysis.html',
          template: 'treemap',
        })
      : (undefined as unknown as ReturnType<typeof visualizer>),
  ].filter(Boolean),
  server: {
    port: 5173,
  },
});
