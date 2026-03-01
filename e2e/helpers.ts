import { Page } from '@playwright/test';

/**
 * 페이지 로드 전에 연령인증 localStorage를 설정하여 오버레이 차단
 */
export async function setupPage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('age_verified', 'true');
  });
}
