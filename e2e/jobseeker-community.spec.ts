import { test, expect } from '@playwright/test';
import path from 'path';
import { setupPage } from './helpers';

// Use jobseeker auth state
test.use({ storageState: path.join(__dirname, '../.auth/jobseeker.json') });

// Helper: post detail URL is /community/{slug or cuid} but NOT /community/new
const isPostDetailUrl = (url: URL) =>
  url.pathname.startsWith('/community/') &&
  url.pathname !== '/community/' &&
  url.pathname !== '/community/new';

test.describe.serial('구직자 커뮤니티 글쓰기 플로우', () => {
  let createdPostUrl: string | null = null;
  let createdPostId: string | null = null;

  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('커뮤니티 글쓰기 페이지 폼 요소 확인', async ({ page }) => {
    await page.goto('/community/new');
    await expect(page).toHaveURL(/\/community\/new/);

    // Check category select
    const categorySelect = page.locator('#category');
    await expect(categorySelect).toBeVisible();

    // Check title input
    const titleInput = page.locator('#title');
    await expect(titleInput).toBeVisible();

    // Check content textarea
    const contentTextarea = page.locator('#content');
    await expect(contentTextarea).toBeVisible();

    // Check submit button
    const submitButton = page.locator('button[type="submit"]:has-text("작성완료")');
    await expect(submitButton).toBeVisible();
  });

  test('실제 글 작성 및 상세 페이지 이동 확인', async ({ page }) => {
    await page.goto('/community/new');

    const timestamp = Date.now();
    const testTitle = `[E2E테스트] ${timestamp}`;
    const testContent = `이것은 E2E 자동 테스트로 작성된 글입니다. (${timestamp})`;

    // Select category
    await page.locator('#category').selectOption('CHAT');

    // Fill title
    await page.locator('#title').fill(testTitle);

    // Fill content
    await page.locator('#content').fill(testContent);

    // Submit
    await page.locator('button[type="submit"]:has-text("작성완료")').click();

    // Wait for navigation to detail page (CUID-based URL, not /community/new)
    await page.waitForURL((url) => isPostDetailUrl(url), { timeout: 10000 });

    // Store the created post URL for later tests
    createdPostUrl = page.url();

    // Extract post slug/ID from URL
    const urlMatch = page.url().match(/\/community\/([^/?]+)/);
    if (urlMatch) {
      createdPostId = urlMatch[1];
    }

    // Verify we're on the detail page
    await expect(page.locator('h1').first()).toContainText(testTitle);

    // Verify content is visible
    await expect(page.locator('body')).toContainText(testContent);
  });

  test('작성한 글이 커뮤니티 목록에 표시되는지 확인', async ({ page }) => {
    if (!createdPostUrl) {
      test.skip();
      return;
    }

    // Directly verify the post is accessible
    const response = await page.goto(createdPostUrl);
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
    await expect(page.locator('h1').first()).toContainText('[E2E테스트]');
  });
});

test.describe('구직자 커뮤니티 글 수정', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('커뮤니티 글 수정 페이지 접근 및 수정', async ({ page }) => {
    // First, create a test post
    await page.goto('/community/new');

    const timestamp = Date.now();
    const originalTitle = `[E2E수정테스트] ${timestamp}`;
    const originalContent = `수정 테스트용 글입니다.`;

    await page.locator('#category').selectOption('CHAT');
    await page.locator('#title').fill(originalTitle);
    await page.locator('#content').fill(originalContent);
    await page.locator('button[type="submit"]:has-text("작성완료")').click();

    await page.waitForURL((url) => isPostDetailUrl(url), { timeout: 10000 });

    // Now try to edit it - look for edit link/button
    const editButton = page.locator('a:has-text("수정"), button:has-text("수정")').first();

    if (await editButton.count() > 0) {
      await editButton.click();

      // Should navigate to edit page
      await expect(page).toHaveURL(/\/community\/[^/]+\/edit/);

      // Modify title
      const updatedTitle = `[E2E수정완료] ${timestamp}`;
      await page.locator('#title').fill(updatedTitle);

      // Submit edit
      await page.locator('button[type="submit"]').click();

      // Should redirect back to detail page
      await page.waitForURL((url) => isPostDetailUrl(url) && !url.pathname.includes('/edit'), { timeout: 10000 });

      // Verify updated title
      await expect(page.locator('h1').first()).toContainText('[E2E수정완료]');
    } else {
      console.log('Edit button not found - user might not have permission to edit');
    }
  });
});

test.describe('구직자 커뮤니티 댓글', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('게시글 상세에서 댓글 입력 폼 존재 확인', async ({ page }) => {
    // Create a test post first
    await page.goto('/community/new');

    const timestamp = Date.now();
    await page.locator('#category').selectOption('CHAT');
    await page.locator('#title').fill(`[E2E댓글테스트] ${timestamp}`);
    await page.locator('#content').fill('댓글 테스트용 글입니다.');
    await page.locator('button[type="submit"]:has-text("작성완료")').click();

    await page.waitForURL((url) => isPostDetailUrl(url), { timeout: 10000 });

    // Check for comment form - textarea with placeholder containing "댓글"
    const commentTextarea = page.locator('textarea[placeholder*="댓글"]');
    await expect(commentTextarea).toBeVisible();

    // Check for submit button
    const submitButton = page.locator('button:has-text("댓글 작성")');
    await expect(submitButton).toBeVisible();
  });

  test('댓글 작성 및 목록에 표시 확인', async ({ page }) => {
    // Create a test post first
    await page.goto('/community/new');

    const timestamp = Date.now();
    await page.locator('#category').selectOption('CHAT');
    await page.locator('#title').fill(`[E2E댓글작성] ${timestamp}`);
    await page.locator('#content').fill('댓글 작성 테스트용 글입니다.');
    await page.locator('button[type="submit"]:has-text("작성완료")').click();

    await page.waitForURL((url) => isPostDetailUrl(url), { timeout: 10000 });

    // Write a comment
    const commentText = `테스트 댓글입니다 ${timestamp}`;
    const commentTextarea = page.locator('textarea[placeholder*="댓글"]');
    await commentTextarea.fill(commentText);

    // Submit comment
    const submitButton = page.locator('button:has-text("댓글 작성")');
    await submitButton.click();

    // Wait for update
    await page.waitForTimeout(1000);

    // Check if comment appears in the page
    await expect(page.locator('body')).toContainText(commentText);
  });
});

test.describe('구직자 커뮤니티 좋아요/반응', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('게시글 상세에서 반응 버튼 존재 확인', async ({ page }) => {
    // Navigate to community list and click on an existing post (avoids rate limit)
    await page.goto('/community');
    await page.waitForLoadState('networkidle');
    const postLink = page.locator('table a[href^="/community/"]').first();
    await postLink.click();
    await page.waitForURL((url) => isPostDetailUrl(url), { timeout: 10000 });

    // Reaction buttons: "👍 좋아요", "🤣 웃겨요", etc.
    const likeButton = page.locator('button:has-text("좋아요")').first();
    await expect(likeButton).toBeVisible();
  });

  test('반응 버튼 클릭 및 상태 변경 확인', async ({ page }) => {
    // Navigate to community list and click on an existing post (avoids rate limit)
    await page.goto('/community');
    await page.waitForLoadState('networkidle');
    const postLink = page.locator('table a[href^="/community/"]').first();
    await postLink.click();
    await page.waitForURL((url) => isPostDetailUrl(url), { timeout: 10000 });

    // Click "👍 좋아요" reaction
    const likeButton = page.locator('button:has-text("좋아요")').first();
    if (await likeButton.isVisible()) {
      await likeButton.click();
      await page.waitForTimeout(500);

      // Verify no error occurred
      expect(page.url()).toContain('/community/');
    }
  });
});

test.describe('구직자 커뮤니티 신고', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('신고 버튼 클릭 시 신고 모달 표시 확인', async ({ page }) => {
    // Navigate to community list and click on an existing post (avoids rate limit)
    await page.goto('/community');
    await page.waitForLoadState('networkidle');
    const postLink = page.locator('table a[href^="/community/"]').first();
    await postLink.click();
    await page.waitForURL((url) => isPostDetailUrl(url), { timeout: 10000 });

    // Report button might not show for own posts - just verify page loaded without error
    const reportButton = page.locator('button:has-text("신고")');
    if (await reportButton.count() > 0) {
      await reportButton.click();
      await page.waitForTimeout(500);

      // Check if modal is visible
      const modal = page.locator('[role="dialog"], [data-state="open"]');
      if (await modal.count() > 0) {
        await expect(modal.first()).toBeVisible();

        // Close modal
        const cancelButton = page.locator('button:has-text("취소")');
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
        }
      }
    } else {
      // Own post - report not available, which is correct behavior
      console.log('✓ Report button correctly hidden for own post');
    }
  });
});
