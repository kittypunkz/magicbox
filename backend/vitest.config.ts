import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.toml' },
      miniflare: {
        bindings: {
          JWT_SECRET: 'vitest-test-secret',
          NODE_ENV: 'test',
        },
      },
      isolatedStorage: true,
    }),
  ],
  test: {
    globals: true,
    globalSetup: ['./test/global.setup.ts'],
    setupFiles: ['./test/setup.ts'],
  },
});
