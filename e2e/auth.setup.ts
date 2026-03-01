import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/jobseeker.json');
const businessAuthFile = path.join(__dirname, '../.auth/business.json');
const adminAuthFile = path.join(__dirname, '../.auth/admin.json');

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001';
const E2E_SECRET = process.env.E2E_CLEANUP_SECRET || '';

// Headers for test API calls (includes secret token for production)
const testApiHeaders: Record<string, string> = E2E_SECRET
  ? { 'x-e2e-secret': E2E_SECRET }
  : {};

// Test accounts
const JOBSEEKER_ACCOUNT = {
  type: 'JOBSEEKER',
  name: 'E2E구직자',
  email: 'e2e-jobseeker@test.com',
  phone: '01099990001',
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!',
};

const BUSINESS_ACCOUNT = {
  type: 'BUSINESS',
  name: 'E2E사장님',
  email: 'e2e-business@test.com',
  phone: '01099990002',
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!',
  businessName: 'E2E테스트업소',
};

const ADMIN_ACCOUNT = {
  type: 'JOBSEEKER',
  name: 'E2E관리자',
  email: 'e2e-admin@test.com',
  phone: '01099990003',
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!',
};

const TEST_EMAILS = [
  JOBSEEKER_ACCOUNT.email,
  BUSINESS_ACCOUNT.email,
  ADMIN_ACCOUNT.email,
];

/**
 * Cleanup test accounts via API
 */
async function cleanupTestAccounts(request: import('@playwright/test').APIRequestContext) {
  try {
    const response = await request.post(`${BASE_URL}/api/test/cleanup`, {
      headers: testApiHeaders,
      data: { emails: TEST_EMAILS },
    });
    if (response.ok()) {
      console.log('✓ Test accounts cleaned up');
    } else {
      console.log(`Cleanup returned ${response.status()} (may be first run)`);
    }
  } catch {
    console.log('Cleanup skipped (API not available)');
  }
}

/**
 * Register with retry on 429 (rate limit)
 */
async function registerWithRetry(
  request: import('@playwright/test').APIRequestContext,
  data: Record<string, string>,
  label: string,
  maxRetries = 3,
) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await request.post(`${BASE_URL}/api/auth/register`, { data });

    if (response.status() === 201) {
      console.log(`✓ ${label} account registered`);
      return response;
    } else if (response.status() === 409) {
      console.log(`✓ ${label} account already exists`);
      return response;
    } else if (response.status() === 429 && attempt < maxRetries) {
      console.log(`⏳ ${label} rate limited, waiting 5s... (attempt ${attempt + 1})`);
      await new Promise((r) => setTimeout(r, 5000));
    } else {
      console.warn(`${label} registration returned ${response.status()}`);
      return response;
    }
  }
}

/**
 * Cleanup and register test accounts via API
 */
setup('register test accounts', async ({ request }) => {
  // Cleanup existing test accounts first
  await cleanupTestAccounts(request);

  // Register accounts with retry on rate limit
  await registerWithRetry(request, JOBSEEKER_ACCOUNT, 'Jobseeker');
  await registerWithRetry(request, BUSINESS_ACCOUNT, 'Business');
  await registerWithRetry(request, ADMIN_ACCOUNT, 'Admin');

  // Promote admin account
  try {
    const promoteResponse = await request.post(`${BASE_URL}/api/test/promote-admin`, {
      headers: testApiHeaders,
      data: { email: ADMIN_ACCOUNT.email },
    });

    if (promoteResponse.ok()) {
      console.log('✓ Admin account promoted to ADMIN role');
    } else {
      console.warn(`Admin promotion returned ${promoteResponse.status()}`);
    }
  } catch (error) {
    console.error('Admin promotion failed:', error);
  }
});

/**
 * Login jobseeker and save auth state
 */
setup('authenticate as jobseeker', async ({ page }) => {
  // Set age verification before navigating
  await page.addInitScript(() => {
    localStorage.setItem('age_verified', 'true');
  });

  await page.goto('/login');

  // Fill login form
  await page.locator('input[type="email"]').fill(JOBSEEKER_ACCOUNT.email);
  await page.locator('input[type="password"]').fill(JOBSEEKER_ACCOUNT.password);

  // Click login button (exact match to avoid "카카오 로그인")
  await page.getByRole('button', { name: '로그인', exact: true }).click();

  // Wait for redirect to complete (either to home or jobseeker page)
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

  // Verify we're logged in (should not be on login page)
  expect(page.url()).not.toContain('/login');

  // Save storage state
  await page.context().storageState({ path: authFile });
  console.log('✓ Jobseeker auth state saved');
});

/**
 * Login business and save auth state
 */
setup('authenticate as business', async ({ page }) => {
  // Set age verification before navigating
  await page.addInitScript(() => {
    localStorage.setItem('age_verified', 'true');
  });

  await page.goto('/login');

  // Fill login form
  await page.locator('input[type="email"]').fill(BUSINESS_ACCOUNT.email);
  await page.locator('input[type="password"]').fill(BUSINESS_ACCOUNT.password);

  // Click login button (exact match)
  await page.getByRole('button', { name: '로그인', exact: true }).click();

  // Wait for redirect to complete
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

  // Verify we're logged in
  expect(page.url()).not.toContain('/login');

  // Save storage state
  await page.context().storageState({ path: businessAuthFile });
  console.log('✓ Business auth state saved');
});

/**
 * Login admin and save auth state
 */
setup('authenticate as admin', async ({ page }) => {
  // Set age verification before navigating
  await page.addInitScript(() => {
    localStorage.setItem('age_verified', 'true');
  });

  await page.goto('/login');

  // Fill login form
  await page.locator('input[type="email"]').fill(ADMIN_ACCOUNT.email);
  await page.locator('input[type="password"]').fill(ADMIN_ACCOUNT.password);

  // Click login button (exact match)
  await page.getByRole('button', { name: '로그인', exact: true }).click();

  // Wait for redirect to complete
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

  // Verify we're logged in
  expect(page.url()).not.toContain('/login');

  // Save storage state
  await page.context().storageState({ path: adminAuthFile });
  console.log('✓ Admin auth state saved');
});
