import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./server/__tests__/helpers/setup.ts'],
    env: {
      DATABASE_URL: 'postgresql://aiops:AIOps!1234@127.0.0.1:5432/aiops_test?schema=aiops&sslmode=disable',
      JWT_SECRET: 'test-secret-key-change-in-production',
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'server/__tests__/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/fixtures/**',
        'dist/',
        'build/',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@server': path.resolve(__dirname, './server'),
    },
  },
});
