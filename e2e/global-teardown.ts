/**
 * Global teardown: cleanup E2E test accounts after all tests finish.
 * This ensures test data doesn't persist in the database (especially on production).
 */
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001';
const E2E_SECRET = process.env.E2E_CLEANUP_SECRET || '';

const TEST_EMAILS = [
  'e2e-jobseeker@test.com',
  'e2e-business@test.com',
  'e2e-admin@test.com',
];

export default async function globalTeardown() {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (E2E_SECRET) {
      headers['x-e2e-secret'] = E2E_SECRET;
    }

    const response = await fetch(`${BASE_URL}/api/test/cleanup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ emails: TEST_EMAILS }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Teardown: ${data.message}`);
    } else {
      console.log(`Teardown cleanup returned ${response.status}`);
    }
  } catch (error) {
    console.log('Teardown cleanup skipped:', error instanceof Error ? error.message : 'unknown error');
  }
}
