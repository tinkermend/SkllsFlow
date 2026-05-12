import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'server/__tests__/fixtures/**/*.test.ts',
      'server/__tests__/unit/**/*.test.ts',
    ],
    env: {
      JWT_SECRET: 'test-secret-key-change-in-production',
      NODE_ENV: 'test',
    },
    exclude: [
      '**/node_modules/**',
      '.opencode/**',
      'server/__tests__/integration/**/*.test.ts',
      'server/__tests__/unit/services/auth.service.test.ts',
      'server/__tests__/unit/services/rbac.service.test.ts',
    ],
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
