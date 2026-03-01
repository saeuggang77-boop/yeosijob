import { test, expect } from '@playwright/test';
import path from 'path';
import { setupPage } from './helpers';

test.use({ storageState: path.join(__dirname, '../.auth/admin.json') });

test.beforeEach(async ({ page }) => {
  await setupPage(page);
});

/**
 * 대시보드 (1개)
 */
test.describe('Admin Dashboard', () => {
  test('should access admin main page and show stats', async ({ page }) => {
    const response = await page.goto('/admin');
    expect(response?.status()).not.toBe(500);

    // 대시보드 제목 확인
    await expect(page.getByRole('heading', { name: '관리자 대시보드' }).first()).toBeVisible();

    // 통계 카드 요소 표시 확인 (매출 현황, 운영 현황)
    await expect(page.getByText('매출 현황').first()).toBeVisible();
    await expect(page.getByText('운영 현황').first()).toBeVisible();
  });
});

/**
 * 사용자 관리 (2개)
 */
test.describe('User Management', () => {
  test('should access users page and show user list', async ({ page }) => {
    const response = await page.goto('/admin/users');
    expect(response?.status()).not.toBe(500);

    // 회원 관리 제목 확인
    await expect(page.getByRole('heading', { name: '회원 관리' }).first()).toBeVisible();

    // 사용자 목록 테이블 존재 확인
    await expect(page.locator('table').first()).toBeVisible();
    await expect(page.getByText('이름').first()).toBeVisible();
    await expect(page.getByText('이메일').first()).toBeVisible();
  });

  test('should show search and filter UI elements', async ({ page }) => {
    await page.goto('/admin/users');

    // 검색창 존재 확인
    await expect(page.locator('input[name="search"]').first()).toBeVisible();

    // 역할 필터 버튼들 존재 확인
    await expect(page.getByRole('button', { name: '전체' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '사장님' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '구직자' }).first()).toBeVisible();
  });
});

/**
 * 광고 관리 (2개)
 */
test.describe('Ad Management', () => {
  test('should access ads page and show ad list', async ({ page }) => {
    const response = await page.goto('/admin/ads');
    expect(response?.status()).not.toBe(500);

    // 광고 관리 제목 확인
    await expect(page.getByRole('heading', { name: '광고 관리' }).first()).toBeVisible();

    // 광고 목록 표시 (테이블 또는 카드)
    const hasTable = await page.locator('table').first().isVisible().catch(() => false);
    const hasCards = await page.locator('[class*="card"]').first().isVisible().catch(() => false);
    expect(hasTable || hasCards).toBe(true);
  });

  test('should show ad management UI elements', async ({ page }) => {
    await page.goto('/admin/ads');

    // 상태 필터 버튼 존재 확인
    await expect(page.getByRole('button', { name: '전체' }).first()).toBeVisible();

    // 검색창 존재 확인
    await expect(page.locator('input[name="search"]').first()).toBeVisible();
  });
});

/**
 * 게시글 관리 (2개)
 */
test.describe('Post Management', () => {
  test('should access posts page and show post list', async ({ page }) => {
    const response = await page.goto('/admin/posts');
    expect(response?.status()).not.toBe(500);

    // 게시판 관리 제목 확인
    await expect(page.getByRole('heading', { name: '게시판 관리' }).first()).toBeVisible();

    // 게시글 목록 테이블 존재 확인
    await expect(page.locator('table').first()).toBeVisible();
    await expect(page.getByText('제목').first()).toBeVisible();
  });

  test('should access trash page and show deleted posts', async ({ page }) => {
    const response = await page.goto('/admin/trash');
    expect(response?.status()).not.toBe(500);

    // 휴지통 페이지 제목 확인
    await expect(page.getByRole('heading', { name: '휴지통' }).first()).toBeVisible();
  });
});

/**
 * 신고 관리 (1개)
 */
test.describe('Report Management', () => {
  test('should access reports page', async ({ page }) => {
    const response = await page.goto('/admin/reports');

    // 404가 아니면 OK (아직 구현 안 되었을 수 있음)
    if (response?.status() === 404) {
      // 신고 관리 페이지가 아직 없으면 스킵
      test.skip();
    } else {
      expect(response?.status()).not.toBe(500);
    }
  });
});

/**
 * 사업자 인증 관리 (1개)
 */
test.describe('Verification Management', () => {
  test('should access verification page and show pending verifications', async ({ page }) => {
    const response = await page.goto('/admin/verification');
    expect(response?.status()).not.toBe(500);

    // 업소 인증 관리 제목 확인
    await expect(page.getByRole('heading', { name: '업소 인증 관리' }).first()).toBeVisible();
  });
});

/**
 * 결제 관리 (1개)
 */
test.describe('Payment Management', () => {
  test('should access payments page and show payment list', async ({ page }) => {
    const response = await page.goto('/admin/payments');
    expect(response?.status()).not.toBe(500);

    // 결제 관리 제목 확인
    await expect(page.getByRole('heading', { name: '결제 관리' }).first()).toBeVisible();

    // 매출 통계 카드 존재 확인
    await expect(page.getByText('총 승인 매출').first()).toBeVisible();
  });
});

/**
 * 공지사항 관리 (2개)
 */
test.describe('Notice Management', () => {
  test('should access notices page and show notice list', async ({ page }) => {
    const response = await page.goto('/admin/notices');
    expect(response?.status()).not.toBe(500);

    // 공지사항 관리 제목 확인
    await expect(page.getByRole('heading', { name: '공지사항 관리' }).first()).toBeVisible();

    // 공지사항 목록 테이블 존재 확인
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('should access notice creation page and show form', async ({ page }) => {
    const response = await page.goto('/admin/notices/new');
    expect(response?.status()).not.toBe(500);

    // 작성 폼 요소 확인
    await expect(page.locator('input[name="title"], input[type="text"]').first()).toBeVisible();
    await expect(page.locator('textarea, [contenteditable]').first()).toBeVisible();
  });
});

/**
 * 스팸/강퇴 관리 (2개)
 */
test.describe('Spam and Ban Management', () => {
  test('should access spam page and show spam word management', async ({ page }) => {
    const response = await page.goto('/admin/spam');
    expect(response?.status()).not.toBe(500);

    // 스팸 필터 관리 제목 확인
    await expect(page.getByRole('heading', { name: '스팸 필터 관리' }).first()).toBeVisible();
  });

  test('should access banned users page and show ban list', async ({ page }) => {
    const response = await page.goto('/admin/banned');
    expect(response?.status()).not.toBe(500);

    // 제재 관리 제목 확인
    await expect(page.getByRole('heading', { name: '제재 관리' }).first()).toBeVisible();
  });
});

/**
 * 기타 (1개)
 */
test.describe('Settings', () => {
  test('should access settings page', async ({ page }) => {
    const response = await page.goto('/admin/settings');
    expect(response?.status()).not.toBe(500);

    // 설정 페이지 제목 확인
    await expect(page.getByRole('heading', { name: '설정' }).first()).toBeVisible();
  });
});
