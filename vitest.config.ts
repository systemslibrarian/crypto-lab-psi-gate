import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Test files import from '../src/foo.js'; Vitest resolves that to the
    // matching .ts source via TypeScript's NodeNext extension rules.
  },
});
