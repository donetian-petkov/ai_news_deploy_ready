import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 390, height: 844 }
});

test('mobile drawer stays within the viewport and stacks the search controls', async ({ page }) => {
  await page.goto('/');

  await page.locator('#menuToggle').click();

  const drawer = page.locator('.mobileDrawerPaper').last();
  await expect(drawer).toBeVisible();

  const widthMetrics = await drawer.evaluate(node => {
    const paper = node as HTMLElement;
    const body = paper.querySelector('.mobileDrawerBody') as HTMLElement | null;
    const controls = paper.querySelector('.controls') as HTMLElement | null;

    return {
      paperClientWidth: paper.clientWidth,
      paperScrollWidth: paper.scrollWidth,
      bodyClientWidth: body?.clientWidth ?? 0,
      bodyScrollWidth: body?.scrollWidth ?? 0,
      controlsClientWidth: controls?.clientWidth ?? 0,
      controlsScrollWidth: controls?.scrollWidth ?? 0
    };
  });

  expect(widthMetrics.paperScrollWidth).toBeLessThanOrEqual(widthMetrics.paperClientWidth + 1);
  expect(widthMetrics.bodyScrollWidth).toBeLessThanOrEqual(widthMetrics.bodyClientWidth + 1);
  expect(widthMetrics.controlsScrollWidth).toBeLessThanOrEqual(widthMetrics.controlsClientWidth + 1);

  await drawer.getByRole('button', { name: /Search|Търсене|Търси/i }).first().click();

  const searchInput = drawer.locator('.topMenuSearchSection input').first();
  const clearButton = drawer.getByRole('button', { name: /Clear|Изчисти/i }).first();

  await expect(searchInput).toBeVisible();
  await expect(clearButton).toBeVisible();

  const searchInputBox = await searchInput.boundingBox();
  const clearButtonBox = await clearButton.boundingBox();

  expect(searchInputBox).not.toBeNull();
  expect(clearButtonBox).not.toBeNull();
  expect(clearButtonBox!.y).toBeGreaterThanOrEqual(searchInputBox!.y + searchInputBox!.height - 1);
});
