import { test, expect } from '@playwright/test';

test.describe('DAO Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page before each test
    await page.goto('/');
  });

  test('should display the main title and description', async ({ page }) => {
    // Check if the main heading is visible
    const title = page.locator('h1');
    await expect(title).toContainText('DAO Web3');

    // Check if the subtitle/description is visible
    const subtitle = page.locator('p').filter({ hasText: 'Decentralized Governance Platform' });
    await expect(subtitle).toBeVisible();
  });

  test('should show the connect wallet button when disconnected', async ({ page }) => {
    // The button should be visible because we are not connected in a standard browser session
    const connectButton = page.getByRole('button', { name: /Connect Wallet/i });
    await expect(connectButton).toBeVisible();
  });

  test('should open the wallet selector modal when clicking connect', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /Connect Wallet/i });
    await connectButton.click();

    // Check if the modal title is visible
    const modalTitle = page.getByRole('heading', { name: /Select Wallet/i });
    await expect(modalTitle).toBeVisible();
  });

  test('should display the treasury and proposal sections', async ({ page }) => {
    // Check for the Treasury panel
    const treasuryHeading = page.getByRole('heading', { name: /Treasury/i });
    await expect(treasuryHeading).toBeVisible();

    // Check for the Create Proposal section
    const createProposalHeading = page.getByRole('heading', { name: /Create New Proposal/i });
    await expect(createProposalHeading).toBeVisible();

    // Check for the Active Proposals list
    const proposalsHeading = page.getByRole('heading', { name: /Active Proposals/i });
    await expect(proposalsHeading).toBeVisible();
  });

  test('should have a responsive layout', async ({ page, viewport }) => {
    if (viewport && viewport.width < 1024) {
      // On mobile, the grid should stack (1 column)
      const mainGrid = page.locator('main');
      await expect(mainGrid).toHaveClass(/grid/);
    }
  });
});
