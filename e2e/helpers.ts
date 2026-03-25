import { Page } from '@playwright/test';

/**
 * 성인인증 API를 모킹하여 오버레이 차단
 */
export async function setupPage(page: Page): Promise<void> {
  await page.route('**/api/auth/verify-age/status', (route) =>
    route.fulfill({ json: { verified: true } })
  );
}
