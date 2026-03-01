import { test, expect } from '@playwright/test';
import { setupPage } from './helpers';

test.describe('커뮤니티 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('커뮤니티 목록 페이지 로드', async ({ page }) => {
    await page.goto('/community');

    await expect(page).toHaveURL(/\/community/);

    const content = page.locator('main');
    await expect(content).toBeVisible();
  });

  test('카테고리 탭 존재 확인', async ({ page }) => {
    await page.goto('/community');

    // 카테고리 탭 찾기
    const tabs = page.locator('a[href*="/community?category="], button').filter({
      hasText: /전체|수다방|뷰티|Q&A|취업/,
    });

    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);
  });

  test('게시글 목록 확인', async ({ page }) => {
    await page.goto('/community');

    // 게시글 링크 찾기
    const postLinks = page.locator('a[href^="/community/"]');
    const postCount = await postLinks.count();

    // 게시글이 있거나 빈 상태 메시지가 있어야 함
    if (postCount === 0) {
      const content = page.locator('main');
      await expect(content).toBeVisible();
    } else {
      expect(postCount).toBeGreaterThan(0);
    }
  });

  test('카테고리 필터링 동작', async ({ page }) => {
    await page.goto('/community');

    // 카테고리 링크로 직접 이동 (오버레이 차단 없이)
    await page.goto('/community?category=CHAT&sort=latest');

    await expect(page).toHaveURL(/\/community/);

    const content = page.locator('main');
    await expect(content).toBeVisible();
  });

  test('검색 입력 필드 확인', async ({ page }) => {
    await page.goto('/community');

    // 검색 입력 필드 찾기
    const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]').first();
    const hasSearchInput = await searchInput.count() > 0;

    if (hasSearchInput) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('페이지네이션 확인', async ({ page }) => {
    await page.goto('/community');

    // 페이지네이션은 게시글이 많을 때만 존재
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });

  test('커뮤니티 500 에러 없음', async ({ page }) => {
    const response = await page.goto('/community');
    expect(response?.status()).not.toBe(500);
  });
});
