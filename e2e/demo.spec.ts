import { test, expect } from '@playwright/test';

// Runs against the seeded demo team (projectflow-api prisma/seed.ts) and cleans up after itself.
test('demo user creates, moves and deletes a task on the board', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open the live demo' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });

  await page.goto('/projects/demo-project-1');
  await expect(page.getByRole('heading', { name: 'Website Redesign' })).toBeVisible();

  const title = `E2E task ${Date.now()}`;
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title').fill(title);
  await page.getByRole('dialog').getByRole('button', { name: 'Create Task' }).click();

  const todo = page.getByRole('region', { name: 'To Do' });
  const inProgress = page.getByRole('region', { name: 'In Progress' });
  const card = page.getByRole('article').filter({ hasText: title });
  await expect(todo.getByText(title)).toBeVisible();

  await card.getByRole('button', { name: /In Progress/ }).click();
  await expect(inProgress.getByText(title)).toBeVisible();

  await card.click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete task' }).click();

  await expect(page).toHaveURL(/\/projects\/demo-project-1$/);
  await expect(page.getByText(title)).toHaveCount(0);
});
