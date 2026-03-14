/**
 * Global teardown: cleanup E2E test accounts after all tests finish.
 * Uses direct DB query instead of API (test API was removed for security).
 */
import { execSync } from 'child_process';
import path from 'path';

const TEST_EMAILS = [
  'e2e-jobseeker@test.com',
  'e2e-business@test.com',
  'e2e-admin@test.com',
];

export default async function globalTeardown() {
  try {
    const emails = TEST_EMAILS.map((e) => `'${e}'`).join(',');
    const sql = `DELETE FROM "users" WHERE "email" IN (${emails})`;
    execSync('npx prisma db execute --stdin', {
      input: sql,
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 15000,
    });
    console.log('✓ Teardown: test accounts cleaned up (DB direct)');
  } catch (error) {
    console.log('Teardown cleanup skipped:', error instanceof Error ? error.message : 'unknown error');
  }
}
