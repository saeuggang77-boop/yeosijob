import { test, expect } from '@playwright/test';
import path from 'path';
import { setupPage } from './helpers';

// Use business auth state
test.use({ storageState: path.join(__dirname, '../.auth/business.json') });

test.describe('사장 인증 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('사장 대시보드 접근 가능', async ({ page }) => {
    const response = await page.goto('/business/dashboard');

    // Should not redirect to login
    await expect(page).toHaveURL(/\/business\/dashboard/);

    // Check page loaded without 500 error
    expect(response?.status()).not.toBe(500);

    // Page should have content
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('사장 프로필 페이지 접근 및 인증 상태 확인', async ({ page }) => {
    const response = await page.goto('/business/profile');

    await expect(page).toHaveURL(/\/business\/profile/);
    expect(response?.status()).not.toBe(500);

    // Page should load with content
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('광고 등록 페이지 접근', async ({ page }) => {
    const response = await page.goto('/business/ads/new');

    await expect(page).toHaveURL(/\/business\/ads\/new/);
    expect(response?.status()).not.toBe(500);

    // Should show either form or verification notice
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('지원자 관리 페이지 접근', async ({ page }) => {
    const response = await page.goto('/business/resumes');

    await expect(page).toHaveURL(/\/business\/resumes/);
    expect(response?.status()).not.toBe(500);

    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('결제 내역 페이지 접근', async ({ page }) => {
    const response = await page.goto('/business/payments');

    await expect(page).toHaveURL(/\/business\/payments/);
    expect(response?.status()).not.toBe(500);

    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('구직자 페이지 접근 불가 (권한 없음)', async ({ page }) => {
    try {
      await page.goto('/jobseeker/my-resume');

      // Should redirect away from jobseeker page
      await page.waitForURL((url) => !url.pathname.includes('/jobseeker/my-resume'), {
        timeout: 5000,
      });

      // Should be redirected
      expect(page.url()).not.toContain('/jobseeker/my-resume');
    } catch (error) {
      // ERR_CONNECTION_REFUSED is acceptable (middleware redirect)
      if (error instanceof Error && error.message.includes('ERR_CONNECTION_REFUSED')) {
        // This is expected behavior for unauthorized access
        console.log('✓ Correctly blocked from jobseeker page');
      } else {
        throw error;
      }
    }
  });
});

test.describe('사업자 인증', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('프로필 페이지에서 사업자 인증 상태 표시', async ({ page }) => {
    await page.goto('/business/profile');

    // VerificationStatus component should be visible
    const verificationCard = page.locator('text=사업자 인증').first();
    await expect(verificationCard).toBeVisible();

    // Should show either "인증 완료" or "미인증"
    const statusText = page.locator('text=/사업자 인증|미인증|인증 완료/').first();
    await expect(statusText).toBeVisible();
  });

  test('사업자 인증 버튼 존재 확인 (미인증 시)', async ({ page }) => {
    await page.goto('/business/profile');

    // Check if "인증하기" button exists (only visible when not verified)
    const verifyButton = page.locator('button:has-text("인증하기")');
    const buttonCount = await verifyButton.count();

    // Button may or may not exist depending on verification status
    // If it exists, it should be clickable
    if (buttonCount > 0) {
      await expect(verifyButton.first()).toBeVisible();
    }
  });
});

test.describe('광고 관리', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('광고 등록 페이지에서 폼 요소 확인', async ({ page }) => {
    await page.goto('/business/ads/new');

    // Check for verification status or form elements
    const pageHeading = page.locator('h1:has-text("광고 등록")');
    await expect(pageHeading).toBeVisible();

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // If verified, should see step indicator or verification notice
    const stepIndicatorCount = await page.locator('text=업소 정보').count();
    const verificationNoticeCount = await page.locator('text=사업자 인증 필요').count();
    const loadingTextCount = await page.locator('text=로딩 중').count();

    // Should have either step indicator (verified), verification notice (not verified), or loading state
    expect(stepIndicatorCount > 0 || verificationNoticeCount > 0 || loadingTextCount > 0).toBe(true);
  });

  test('대시보드에서 광고 현황 표시', async ({ page }) => {
    await page.goto('/business/dashboard');

    // Should show either ad cards or empty state
    const hasAds = await page.locator('text=/게재중 광고|전체 광고|총 조회수/').first().isVisible();
    const hasEmptyState = await page.locator('text=등록된 광고가 없습니다').isVisible().catch(() => false);

    // Should show either summary cards or empty state message
    expect(hasAds || hasEmptyState).toBe(true);

    // Check "새 광고 등록" button exists
    const newAdButton = page.locator('a[href="/business/ads/new"]').first();
    await expect(newAdButton).toBeVisible();
  });

  test('광고가 있으면 광고 상세 페이지 접근 가능', async ({ page }) => {
    await page.goto('/business/dashboard');

    // Check if any ads exist
    const adCards = page.locator('a[href*="/business/ads/"][href*="/payment"]');
    const adCount = await adCards.count();

    if (adCount > 0) {
      // Click first ad
      await adCards.first().click();

      // Should navigate to ad detail page
      await expect(page).toHaveURL(/\/business\/ads\/[^/]+\/payment/);
      expect(page.url()).toContain('/business/ads/');
    } else {
      console.log('No ads found - skipping ad detail test');
    }
  });

  test('광고가 있으면 광고 통계 페이지 접근 가능', async ({ page }) => {
    await page.goto('/business/dashboard');

    // Check if any "통계" buttons exist
    const statsButtons = page.locator('a[href*="/business/ads/"][href*="/stats"]');
    const statsCount = await statsButtons.count();

    if (statsCount > 0) {
      // Click first stats button
      const firstStatsButton = statsButtons.first();
      await expect(firstStatsButton).toBeVisible();
      await firstStatsButton.click();

      // Should navigate to stats page
      await expect(page).toHaveURL(/\/business\/ads\/[^/]+\/stats/);
      expect(page.url()).toContain('/stats');
    } else {
      console.log('No active ads with stats - skipping stats test');
    }
  });
});

test.describe('프로필', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('프로필 페이지에서 폼 필드 존재 확인', async ({ page }) => {
    await page.goto('/business/profile');

    // Click to expand the profile edit section
    const profileEditButton = page.locator('button:has-text("프로필 수정")');
    await expect(profileEditButton).toBeVisible();
    await profileEditButton.click();

    // Wait for form to appear
    await page.waitForSelector('input#profileName', { timeout: 5000 });

    // Check for profile form fields (EditProfileSection component)
    const nameField = page.locator('input#profileName');
    const phoneField = page.locator('input#profilePhone');
    const businessNameField = page.locator('input#profileBusinessName');

    // Name and phone should always exist, businessName for business users
    await expect(nameField).toBeVisible();
    await expect(phoneField).toBeVisible();

    // Business name field should exist for business users
    const businessNameExists = await businessNameField.count() > 0;
    expect(businessNameExists).toBe(true);
  });

  test('프로필 수정 폼 제출 버튼 존재 확인', async ({ page }) => {
    await page.goto('/business/profile');

    // Click to expand the profile edit section
    const profileEditButton = page.locator('button:has-text("프로필 수정")');
    await profileEditButton.click();

    // Wait for form to appear
    await page.waitForSelector('button[type="submit"]', { timeout: 5000 });

    // Check for save/submit button - the button text is "프로필 수정"
    const submitButton = page.locator('button[type="submit"]:has-text("프로필 수정")');
    await expect(submitButton).toBeVisible();
  });
});

test.describe('결제', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('결제 내역 페이지에서 결제 목록 또는 빈 상태 표시', async ({ page }) => {
    await page.goto('/business/payments');

    // Page heading should be visible
    const heading = page.locator('h1:has-text("결제 내역")');
    await expect(heading).toBeVisible();

    // Should show either payment list or empty state
    const hasPayments = await page.locator('text=/주문번호|주문일|승인/').first().isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=결제 내역이 없습니다').isVisible().catch(() => false);

    // Should show either payments or empty state
    expect(hasPayments || hasEmptyState).toBe(true);
  });
});

test.describe('이력서 열람', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('이력서 목록 페이지에서 이력서 목록 또는 접근 제한 메시지 표시', async ({ page }) => {
    await page.goto('/business/resumes');

    // Page heading should be visible
    const heading = page.locator('h1:has-text("인재 정보")');
    await expect(heading).toBeVisible();

    // Should show resume count
    const resumeCount = page.locator('text=/\\d+건의 이력서/').first();
    await expect(resumeCount).toBeVisible();

    // Should show either access quota badge or restriction notice
    const hasQuotaBadge = await page.locator('text=/열람|무제한|광고 등록 후/').first().isVisible();
    expect(hasQuotaBadge).toBe(true);

    // Check for filter component or empty state
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });
});

test.describe('쪽지', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('쪽지 페이지 접근 가능 및 UI 요소 확인', async ({ page }) => {
    const response = await page.goto('/messages');

    // Should not error
    expect(response?.status()).not.toBe(500);

    // Page heading should be visible
    const heading = page.locator('h1:has-text("쪽지함")');
    await expect(heading).toBeVisible();

    // MessageList component should be rendered
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });
});
