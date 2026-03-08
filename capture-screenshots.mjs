#!/usr/bin/env node
/**
 * Playwright script to capture Imperium Romanum screenshots.
 * Run: npx playwright install chromium && node capture-screenshots.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const URL = 'http://localhost:3000';
const OUT = './screenshots';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(2000);

    // Ensure sidebar is open and select an event with locations
    const menuBtn = await page.locator('button:has-text("MENU")');
    if (await menuBtn.getAttribute('aria-expanded') === 'false') {
      await menuBtn.click();
      await page.waitForTimeout(300);
    }

    // Click "Territorial Expansion" category, then "Kingdom of Rome"
    await page.locator('button[role="tab"]:has-text("Territorial")').first().click();
    await page.waitForTimeout(400);
    await page.locator('button[role="option"]:has-text("Kingdom of Rome")').first().click();
    await page.waitForTimeout(1500);

    // Screenshot 1: Globe with Rome marker (Kingdom of Rome)
    await page.screenshot({ path: `${OUT}/1-globe-kingdom-rome.png`, fullPage: false });
    console.log('Saved: 1-globe-kingdom-rome.png');

    // Select event with multiple locations and paths (Conquest of Italy)
    await page.locator('button[role="option"]:has-text("Conquest of Italy")').first().click();
    await page.waitForTimeout(1500);

    // Screenshot 2: Globe with multiple markers and arrows
    await page.screenshot({ path: `${OUT}/2-globe-conquest-italy.png`, fullPage: false });
    console.log('Saved: 2-globe-conquest-italy.png');

    // Hover over a marker to trigger tooltip (we need to find canvas and simulate)
    // Tooltips appear on hover - try clicking Rome in the sidebar Locations list
    await page.locator('aside div:has-text("Rome")').first().click();
    await page.waitForTimeout(500);

    // Screenshot 3: After clicking location - may show wiki panel
    await page.screenshot({ path: `${OUT}/3-after-click-rome-location.png`, fullPage: false });
    console.log('Saved: 3-after-click-rome-location.png');

    // Select Hannibal's campaign (has paths/arrows)
    await page.locator('button[role="tab"]:has-text("Battles")').first().click();
    await page.waitForTimeout(400);
    await page.locator('button[role="option"]:has-text("Hannibal")').first().click();
    await page.waitForTimeout(2000);

    // Advance timeline so arrows appear
    const slider = await page.locator('input[type="range"]');
    if (await slider.isVisible()) {
      await slider.fill('50'); // Move to middle of range
      await page.waitForTimeout(1000);
    }

    // Screenshot 4: Globe with arrow paths (Hannibal's campaign)
    await page.screenshot({ path: `${OUT}/4-globe-hannibal-arrows.png`, fullPage: false });
    console.log('Saved: 4-globe-hannibal-arrows.png');

    // Click a route in sidebar to open wiki panel
    await page.locator('aside div:has-text("Route")').first().click();
    await page.waitForTimeout(800);

    // Screenshot 5: Wiki panel open (encyclopedia)
    await page.screenshot({ path: `${OUT}/5-wiki-panel-route.png`, fullPage: false });
    console.log('Saved: 5-wiki-panel-route.png');

    console.log(`\nAll screenshots saved to ${OUT}/`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
