import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      exclude: ['build/**/*', 'src/main.ts'],
      reporter: ['text', 'json', 'html'],
    },
  },
});
