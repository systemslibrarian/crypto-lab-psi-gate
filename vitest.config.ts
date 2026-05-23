import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Test files import from '../src/foo.js'; Vitest resolves that to the
    // matching .ts source via TypeScript's NodeNext extension rules.
    // Property tests run real ristretto scalar muls — ~6–10s each on JS;
    // raise the per-test timeout above vitest 3's 5s default.
    testTimeout: 30_000,
  },
});
