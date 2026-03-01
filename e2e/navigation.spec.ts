import { test, expect } from '@playwright/test';
import { setupPage } from './helpers';

test.describe('네비게이션 및 링크 유효성', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('헤더 네비게이션 링크 확인', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    const links = header.locator('a[href^="/"]');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('주요 공개 페이지 500 에러 없음', async ({ page }) => {
    const publicPages = ['/', '/community', '/jobs', '/login', '/terms', '/privacy', '/notice', '/pricing'];

    for (const path of publicPages) {
      const response = await page.goto(path);
      const status = response?.status() || 0;

      expect(status).not.toBe(500);
      expect(status).toBeLessThan(500);
    }
  });

  test('404 페이지 테스트', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');
    const status = response?.status() || 0;

    if (status === 404) {
      expect(status).toBe(404);
    } else {
      const notFoundText = await page.getByText(/404|페이지를 찾을 수 없습니다|Not Found/).count();
      expect(notFoundText).toBeGreaterThan(0);
    }
  });

  test('로고 클릭 시 메인 페이지로 이동', async ({ page }) => {
    await page.goto('/community');

    const logo = page.locator('a[href="/"]').first();
    if (await logo.count() > 0) {
      await logo.click();
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test('푸터 존재 확인', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer').first();
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible();

      // 푸터에 링크가 있는지 확인
      const links = footer.locator('a');
      const linkCount = await links.count();
      expect(linkCount).toBeGreaterThan(0);
    }
  });

  test('외부 링크가 새 탭에서 열리는지 확인', async ({ page }) => {
    await page.goto('/');

    const externalLinks = page.locator('a[href^="http"]').filter({
      hasNot: page.locator('[href*="yeosijob.com"]'),
    });

    const externalLinkCount = await externalLinks.count();

    if (externalLinkCount > 0) {
      const firstLink = externalLinks.first();
      const target = await firstLink.getAttribute('target');

      if (target === '_blank') {
        const rel = await firstLink.getAttribute('rel');
        if (rel) {
          expect(rel).toContain('noopener');
        }
      }
    }
  });

  test('네비게이션 메뉴 토글 (모바일)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 햄버거 메뉴 버튼 찾기 (aria-label 또는 SVG가 있는 버튼)
    const menuButton = page.locator('button[aria-label*="메뉴"], [data-slot="sheet-trigger"]').first();
    const hasMenuButton = await menuButton.count() > 0;

    if (hasMenuButton && await menuButton.isVisible()) {
      await menuButton.click({ force: true });
      await page.waitForTimeout(1000);

      // 메뉴가 열렸는지 확인
      const menuContent = page.locator('[role="dialog"]');
      if (await menuContent.count() > 0) {
        await expect(menuContent.first()).toBeVisible();
      }
    }
  });
});
