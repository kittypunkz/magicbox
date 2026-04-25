import { readD1Migrations } from '@cloudflare/vitest-pool-workers';
import { resolve } from 'node:path';

// Runs in the host Node.js process before any tests.
// Reads migration SQL files and provides them to worker-side setup via inject().
export async function setup({ provide }: { provide: (key: string, value: unknown) => void }) {
  const migrations = await readD1Migrations(resolve(__dirname, '../migrations'));
  provide('d1Migrations', migrations);
}
