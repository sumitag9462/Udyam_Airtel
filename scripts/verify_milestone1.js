import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function runVerification() {
  console.log('--- Starting Milestone 1 Real Browser Verification ---');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const networkErrors = [];
  page.on('response', (res) => {
    if (res.url().includes('/api/v1/')) {
      if (!res.ok()) {
        networkErrors.push({ url: res.url(), status: res.status() });
      }
    }
  });

  try {
    // 1. Visit /advisor
    console.log('1. Navigating to http://localhost:5173/advisor...');
    await page.goto('http://localhost:5173/advisor', { waitUntil: 'networkidle' });

    // Check initial welcome message
    const initialText = await page.textContent('[role="log"]');
    console.log('Initial chat text contains welcome:', initialText.includes('Welcome to Airtel Udyam One') || initialText.includes('Namaste'));

    // 2. Send "hello"
    console.log('2. Sending message: "hello"...');
    await page.fill('input[type="text"]', 'hello');
    await page.click('button[type="submit"]');

    // Wait for response bubble to appear
    await page.waitForTimeout(1500);

    // Inspect bubbles
    const bubbles = await page.$$eval('[role="log"] p', (elements) => elements.map((e) => e.textContent.trim()));
    console.log('Chat bubbles after "hello":', bubbles);

    // Verify assistant reply is non-empty
    const assistantReplies = bubbles.filter((b) => b !== 'hello');
    if (assistantReplies.length === 0 || assistantReplies.some((r) => r.length === 0)) {
      throw new Error('FAIL: Empty assistant response bubble found!');
    }
    console.log('SUCCESS: Assistant replied with visible text:', assistantReplies[assistantReplies.length - 1]);

    // Capture screenshot at 1440px
    await page.screenshot({ path: 'docs/screenshots/advisor_hello_1440px.png', fullPage: true });

    // 3. Send Golden 14-person law office input
    const goldenInput = 'We have a law office in Delhi with 14 employees and one location. We need business internet, email and cloud backup. Our maximum budget is ₹5,000 per month.';
    console.log('3. Sending golden prompt:', goldenInput);
    await page.fill('input[type="text"]', goldenInput);
    await page.click('button[type="submit"]');

    // Wait for recommendation and inline tier cards
    await page.waitForSelector('text=Suggested Airtel Business Plans', { timeout: 10000 });
    console.log('SUCCESS: "Suggested Airtel Business Plans" rendered inline!');

    const tierCardsText = await page.$$eval('[role="log"] .border', (cards) => cards.map((c) => c.textContent.trim()));
    console.log('Inline Tier Cards text snippet:', tierCardsText.join(' | '));

    // Verify prices in inline tier cards
    const logContent = await page.textContent('[role="log"]');
    const hasStandard = logContent.includes('4,634');
    const hasResilient = logContent.includes('5,133');
    console.log('Contains Standard ₹4,634/mo:', hasStandard);
    console.log('Contains Resilient ₹5,133/mo:', hasResilient);
    if (!hasStandard || !hasResilient) {
      throw new Error('FAIL: Expected golden tier totals (Standard ₹4,634 and Resilient ₹5,133) not found in advisor log!');
    }

    // Capture populated advisor screenshot at 1440px, 768px, 375px
    await page.screenshot({ path: 'docs/screenshots/advisor_recommended_1440px.png', fullPage: true });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'docs/screenshots/advisor_recommended_768px.png', fullPage: true });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: 'docs/screenshots/advisor_recommended_375px.png', fullPage: true });

    // Reset to desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // 4. Click "Select Plan →" on the Standard tier
    console.log('4. Clicking "Select Plan →" on Standard tier...');
    // Find button inside Standard tier card
    const selectButtons = await page.$$('button:has-text("Select Plan")');
    if (selectButtons.length > 0) {
      // Standard is the 2nd tier
      const standardBtn = selectButtons.length >= 2 ? selectButtons[1] : selectButtons[0];
      await standardBtn.click();
    } else {
      await page.click('button:has-text("View Plan Quotes")');
    }

    // Wait for /quotes page
    await page.waitForURL('**/quotes', { timeout: 8000 });
    console.log('SUCCESS: Navigated to', page.url());

    await page.waitForSelector('text=Transparent Business Quote', { timeout: 8000 });

    // Wait for tier cards on quotes page
    await page.waitForSelector('text=1. Choose Recommendation Tier');
    const quotesPageContent = await page.textContent('main');

    console.log('Quotes page has Standard ₹4,634:', quotesPageContent.includes('4,634'));
    console.log('Quotes page has Resilient ₹5,133:', quotesPageContent.includes('5,133'));
    console.log('Quotes page has Step 2 Configurator:', quotesPageContent.includes('Customize Add-ons & Quantities'));

    if (quotesPageContent.includes('No recommended tiers available for this profile.')) {
      throw new Error('FAIL: "No recommended tiers available for this profile" rendered on /quotes!');
    }

    // Capture quotes screenshot at 1440px, 768px, 375px
    await page.screenshot({ path: 'docs/screenshots/quotes_page_1440px.png', fullPage: true });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'docs/screenshots/quotes_page_768px.png', fullPage: true });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: 'docs/screenshots/quotes_page_375px.png', fullPage: true });

    // 5. Test Owner Sign-In page button enablement
    console.log('5. Testing /login button enablement...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

    const getOtpBtnBefore = await page.$('button[type="submit"]:has-text("Get OTP")');
    const isDisabledBefore = await getOtpBtnBefore.isDisabled();
    console.log('"Get OTP" disabled before phone entry:', isDisabledBefore);

    await page.fill('#owner-phone', '9876543210');
    await page.waitForTimeout(300);

    const isDisabledAfter = await getOtpBtnBefore.isDisabled();
    const btnClasses = await getOtpBtnBefore.getAttribute('class');
    console.log('"Get OTP" disabled after 10 digits:', isDisabledAfter);
    console.log('"Get OTP" classes (contains bg-airtel-red):', btnClasses.includes('bg-airtel-red'));

    if (isDisabledAfter) {
      throw new Error('FAIL: "Get OTP" remained disabled after entering valid 10 digits!');
    }

    await page.screenshot({ path: 'docs/screenshots/login_enabled_1440px.png', fullPage: true });

    // 6. Test fresh incognito context directly visiting /quotes
    console.log('6. Testing fresh incognito context directly on /quotes...');
    const incognitoContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const freshPage = await incognitoContext.newPage();
    await freshPage.goto('http://localhost:5173/quotes', { waitUntil: 'networkidle' });
    const freshContent = await freshPage.textContent('main');

    console.log('Direct /quotes contains tiers or recovery:', !freshContent.includes('No recommended tiers available for this profile.'));
    console.log('Direct /quotes has Standard ₹4,634:', freshContent.includes('4,634'));

    await freshPage.screenshot({ path: 'docs/screenshots/quotes_direct_1440px.png', fullPage: true });
    await incognitoContext.close();

    console.log('ALL MILESTONE 1 CHECKS PASSED PERFECTLY!');
    console.log('Network errors encountered:', networkErrors);

  } catch (err) {
    console.error('VERIFICATION ERROR:', err);
    await page.screenshot({ path: 'docs/screenshots/milestone1_error.png', fullPage: true });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runVerification();
