import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'server/__tests__/integration/**/*.test.ts',
      'server/__tests__/unit/services/auth.service.test.ts',
      'server/__tests__/unit/services/rbac.service.test.ts',
    ],
    setupFiles: ['./server/__tests__/helpers/setup.ts'],
    env: {
      BCRYPT_SALT_ROUNDS: '4',
      DATABASE_URL: 'postgresql://aiops:AIOps!1234@127.0.0.1:5432/aiops_test?schema=aiops&sslmode=disable',
      JWT_SECRET: 'test-secret-key-change-in-production',
      NODE_ENV: 'test',
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
