import { test, expect } from '@playwright/test';

test('chosen places reach a reloadable route report through the real engine', async ({ page }) => {
  await page.goto('/plan');
  await page.getByRole('button', { name: '이동 방식 고르기' }).click();
  await page.getByRole('button', { name: '동선 만들기', exact: true }).click();
  await expect(page).toHaveURL(/\/result\//);
  await expect(page.getByRole('heading', { name: '오늘의 내리막 코스' })).toBeVisible();
  await expect(page.getByRole('region', { name: '동선 지도' })).toBeVisible();
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: '오늘의 내리막 코스' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('missing result offers recovery instead of a fabricated route', async ({ page }) => {
  await page.goto('/result/missing');
  await expect(page.getByText('저장된 코스를 찾지 못했어요')).toBeVisible();
  await expect(page.getByRole('link', { name: '새 코스 만들기' })).toHaveAttribute('href', '/plan');
});
