import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Strict WCAG regression gate for the PSI Gate (DH-PSI on ristretto255) demo.
 *
 * The app is a single-page, tab-based SPA (six exhibits rendered by main.ts).
 * Inactive tabpanels are display:none, and every exhibit injects its result
 * region only after a "run" button is clicked. So we DRIVE every live demo,
 * then force ALL tabpanels visible, so the dynamically-injected output regions
 * (intersection results, protocol steps, attack tables, benchmarks, the DDH
 * histogram, test vectors) are in the DOM and rendered when axe runs.
 *
 * There are no <details> here (collapsibles are class-toggled), but we still
 * generically expand any collapsibles for robustness. Scans both themes with
 * WCAG 2.0/2.1 A + AA rules; asserts zero violations.
 */

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// Neutralize animation/transition/opacity so mid-flight states (tab fade-in,
// spinner) can't hide text from the contrast checker.
async function killMotion(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `*,*::before,*::after{
      animation-duration:0s!important;animation-delay:0s!important;
      transition-duration:0s!important;transition-delay:0s!important;
      opacity:1!important;scroll-behavior:auto!important;
    }`,
  });
}

// Force every tabpanel + any [hidden]/collapsible into the visible tree so axe
// scans the whole page in one pass (tabs are display:none until .active).
async function revealAll(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const d of document.querySelectorAll('details')) (d as HTMLDetailsElement).open = true;
    for (const el of document.querySelectorAll<HTMLElement>('[hidden]')) el.removeAttribute('hidden');
    for (const p of document.querySelectorAll<HTMLElement>('[role="tabpanel"]')) {
      p.classList.add('active');
      p.style.display = 'block';
    }
  });
}

// Drive every live demo so injected output regions exist during the scan.
// Each exhibit lives in its own tabpanel; click the tab first so the demo is
// interactable, then trigger its run button(s).
async function driveDemos(page: Page): Promise<void> {
  // Exhibit 1 — Contact Discovery.
  await page.locator('#tab-1').click();
  await page.locator('#e1-run').click();
  await expect(page.locator('#e1-output .result-box')).toBeVisible();

  // Exhibit 2 — Protocol Walkthrough: step through EVERY step so all injected
  // markup (primer terms, identity chips, scalar buttons, the two-path snap,
  // the final verification info-grid) renders and gets scanned. Next disables
  // itself on the last step, so loop until it does.
  await page.locator('#tab-2').click();
  const e2next = page.locator('#e2-next');
  for (let i = 0; i < 8; i++) {
    if (await e2next.isDisabled()) break;
    await e2next.click();
  }
  await expect(page.locator('#e2-panel .info-grid').first()).toBeVisible();

  // Exhibit 3 — Live Simulator: run DH, then switch to OPRF and run again.
  await page.locator('#tab-3').click();
  await page.locator('#e3-run').click();
  await expect(page.locator('#e3-output .result-box')).toBeVisible({ timeout: 15_000 });
  await page.locator('input[name="e3-proto"][value="oprf"]').check();
  await page.locator('#e3-run').click();
  await expect(page.locator('#e3-output .result-box')).toBeVisible({ timeout: 15_000 });

  // Exhibit 4 — every attack demo (each injects a result-box / table).
  await page.locator('#tab-4').click();
  for (const id of ['#e4-a1-run', '#e4-a2-run', '#e4-a3-run', '#e4-a4-run', '#e4-a5-run']) {
    await page.locator(id).click();
  }
  await expect(page.locator('#e4-a5-output .probe-table')).toBeVisible();

  // Exhibit 5 — Real-World: self-test runs on a timer; just reveal + wait.
  await page.locator('#tab-5').click();
  await expect(page.locator('#e5-selftest .card')).toBeVisible({ timeout: 15_000 });

  // Exhibit 6 — Cryptographer's Lab: test vectors render on load; drive the
  // transcript/benchmark/DDH buttons so their output regions exist.
  await page.locator('#tab-6').click();
  await expect(page.locator('#e6-tv-output .card').first()).toBeVisible();
  await page.locator('#e6-bm-run').click();
  await expect(page.locator('#e6-bm-output .bench-table')).toBeVisible({ timeout: 60_000 });
  // Wait for the run to fully settle (button re-enabled) so its primary-fill
  // background is painted — not the transient disabled/spinner state — when axe
  // measures contrast.
  await expect(page.locator('#e6-bm-run')).toBeEnabled({ timeout: 60_000 });
  await page.locator('#e6-ddh-run').click();
  await expect(page.locator('#e6-ddh-output .ddh-chart')).toBeVisible({ timeout: 60_000 });
  // The two constrained-byte charts (byte 0, byte 31) render in the same pass
  // and carry their own aria-labels and figcaptions, so axe must see them too.
  await expect(page.locator('#e6-ddh-output .ddh-mini')).toHaveCount(2, { timeout: 60_000 });
  await expect(page.locator('#e6-ddh-run')).toBeEnabled({ timeout: 60_000 });
}

async function scan(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 5),
  }));
  expect(summary).toEqual([]);
}

// Exhibit 2 renders one step at a time (innerHTML is replaced on each Next), so
// a single end-of-run scan only ever sees the LAST step. Walk every step and
// scan the panel each time so the primer's glossary terms, the identity chips,
// the single/double-blind lists, and the two-path "byte-identical" snap all get
// contrast-checked in whichever theme is active.
async function scanWalkthroughSteps(page: Page): Promise<void> {
  await page.locator('#tab-2').click();
  // Rewind to the first step.
  const prev = page.locator('#e2-prev');
  for (let i = 0; i < 8; i++) {
    if (await prev.isDisabled()) break;
    await prev.click();
  }
  const next = page.locator('#e2-next');
  for (let i = 0; i < 8; i++) {
    await killMotion(page);
    const results = await new AxeBuilder({ page })
      .include('#e2-panel')
      .withTags(TAGS)
      .analyze();
    expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(' ')) }))).toEqual([]);
    if (await next.isDisabled()) break;
    await next.click();
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('.');
  // App is rendered by main.ts; wait for the shared header toggle + first tab.
  await expect(page.locator('#cl-theme-toggle')).toBeVisible();
  await expect(page.locator('#tab-1')).toBeVisible();
  await killMotion(page);
});

test('no WCAG A/AA violations in dark theme (all demos driven)', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await driveDemos(page);
  await scanWalkthroughSteps(page);
  await killMotion(page);
  await revealAll(page);
  await scan(page);
});

test('no WCAG A/AA violations in light theme (all demos driven)', async ({ page }) => {
  await page.locator('#cl-theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await driveDemos(page);
  await scanWalkthroughSteps(page);
  await killMotion(page);
  await revealAll(page);
  await scan(page);
});
