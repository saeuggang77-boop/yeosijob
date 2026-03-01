import { test, expect } from '@playwright/test';
import { setupPage } from './helpers';

test.describe('공개 페이지 접속 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('메인 페이지 로드 및 주요 요소 확인', async ({ page }) => {
    const response = await page.goto('/');

    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/여시잡/);

    // 주요 요소 확인
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();

    // 네비게이션 확인
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // 500 에러 없는지 확인
    expect(response?.status()).not.toBe(500);
  });

  test('커뮤니티 페이지 로드 및 게시글 목록 확인', async ({ page }) => {
    const response = await page.goto('/community');

    await expect(page).toHaveURL(/\/community/);

    const content = page.locator('main');
    await expect(content).toBeVisible();

    expect(response?.status()).not.toBe(500);
  });

  test('구인구직 페이지 로드', async ({ page }) => {
    const response = await page.goto('/jobs');

    await expect(page).toHaveURL(/\/jobs/);

    const content = page.locator('main');
    await expect(content).toBeVisible();

    expect(response?.status()).not.toBe(500);
  });

  test('로그인 페이지 로드 및 폼 요소 확인', async ({ page }) => {
    const response = await page.goto('/login');

    await expect(page).toHaveURL(/\/login/);

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    const loginButton = page.getByRole('button', { name: '로그인', exact: true });
    await expect(loginButton).toBeVisible();

    expect(response?.status()).not.toBe(500);
  });

  test('알바 회원가입 페이지 로드', async ({ page }) => {
    const response = await page.goto('/register/jobseeker');

    await expect(page).toHaveURL(/\/register\/jobseeker/);

    const form = page.locator('form');
    await expect(form).toBeVisible();

    expect(response?.status()).not.toBe(500);
  });

  test('사장 회원가입 페이지 로드 및 사업자번호 필드 없음 확인', async ({ page }) => {
    const response = await page.goto('/register/business');

    await expect(page).toHaveURL(/\/register\/business/);

    const form = page.locator('form');
    await expect(form).toBeVisible();

    // 사업자번호 필드가 없는지 확인
    const businessNumberInput = page.locator('input[name*="사업자"]');
    await expect(businessNumberInput).not.toBeVisible();

    expect(response?.status()).not.toBe(500);
  });

  test('비밀번호 찾기 페이지 로드', async ({ page }) => {
    const response = await page.goto('/forgot-password');

    await expect(page).toHaveURL(/\/forgot-password/);

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    expect(response?.status()).not.toBe(500);
  });

  test('이용약관 페이지 로드', async ({ page }) => {
    const response = await page.goto('/terms');

    await expect(page).toHaveURL(/\/terms/);

    const content = page.locator('main');
    await expect(content).toBeVisible();

    expect(response?.status()).not.toBe(500);
  });

  test('개인정보처리방침 페이지 로드', async ({ page }) => {
    const response = await page.goto('/privacy');

    await expect(page).toHaveURL(/\/privacy/);

    const content = page.locator('main');
    await expect(content).toBeVisible();

    expect(response?.status()).not.toBe(500);
  });

  test('공지사항 페이지 로드', async ({ page }) => {
    const response = await page.goto('/notice');

    await expect(page).toHaveURL(/\/notice/);

    const content = page.locator('main');
    await expect(content).toBeVisible();

    expect(response?.status()).not.toBe(500);
  });

  test('가격정보 페이지 로드', async ({ page }) => {
    const response = await page.goto('/pricing');

    await expect(page).toHaveURL(/\/pricing/);

    const content = page.locator('main');
    await expect(content).toBeVisible();

    expect(response?.status()).not.toBe(500);
  });
});
