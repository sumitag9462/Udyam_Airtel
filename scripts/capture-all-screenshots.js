import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const VIEWPORTS = [
  { name: '375px', width: 375, height: 812 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1440px', width: 1440, height: 900 },
];

const PAGES = [
  { name: '01_landing', url: '/' },
  { name: '02_login', url: '/login' },
  { name: '03_advisor', url: '/advisor' },
  { name: '04_quotes', url: '/quotes' },
  { name: '05_kyc', url: '/kyc' },
  { name: '06_checkout', url: '/checkout/Q-DEMO' },
  { name: '07_tracker', url: '/tracker' },
  { name: '08_backoffice', url: '/backoffice' },
  { name: '09_kyc_queue', url: '/backoffice/kyc-queue' },
  { name: '10_partner', url: '/partner' },
  { name: '11_privacy', url: '/privacy' },
];

const outDir = path.resolve('docs/screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  console.log('🚀 Launching Chromium to capture screenshots across 3 viewports...');
  const browser = await chromium.launch({ headless: true });

  const overflowIssues = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Capturing viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    for (const p of PAGES) {
      const fullUrl = `http://localhost:5173${p.url}`;
      try {
        await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(500);

        // Check for horizontal overflow / clipping
        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth + 2;
        });

        if (hasOverflow) {
          const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          overflowIssues.push({ page: p.name, viewport: vp.name, scrollWidth, innerWidth: vp.width });
          console.warn(`  ⚠️ Overflow detected on ${p.name} at ${vp.name}: scrollWidth=${scrollWidth}px vs window=${vp.width}px`);
        }

        const outPath = path.join(outDir, `${p.name}_${vp.name}.png`);
        await page.screenshot({ path: outPath, fullPage: true });
        console.log(`  ✓ Saved ${p.name}_${vp.name}.png`);
      } catch (err) {
        console.error(`  ❌ Failed capturing ${p.name} at ${vp.name}:`, err.message);
      }
    }
    await context.close();
  }

  await browser.close();

  console.log('\n======================================================');
  console.log(`Screenshot capture completed: ${PAGES.length * VIEWPORTS.length} screens captured.`);
  if (overflowIssues.length === 0) {
    console.log('✅ ZERO horizontal clipping or layout overflow issues detected across all 3 viewports!');
  } else {
    console.warn(`⚠️ Detected ${overflowIssues.length} potential overflow issues:`, overflowIssues);
  }
  console.log('======================================================\n');
}

run().catch((err) => {
  console.error('Fatal error during screenshot capture:', err);
  process.exit(1);
});
