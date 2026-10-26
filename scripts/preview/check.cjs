// Set PLAYWRIGHT_MODULE to an existing Playwright package when it is not installed locally.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = path.resolve(__dirname, '../../artifacts/preview-checks');
fs.mkdirSync(output, { recursive: true });
const resultPath = path.join(output, 'result.json');
fs.writeFileSync(resultPath, JSON.stringify({ status: 'running' }));

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const errors = [], blocked = [], passed = [];
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
      blocked.push(url.origin); return route.abort();
    });
    const open = async query => { await page.goto('http://127.0.0.1:3117/' + query, { waitUntil: 'networkidle' }); };
    const tab = name => page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name, exact: true }).click();
    await open('');
    await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'crew-main');
    const bell = page.getByRole('button', { name: 'Notifications', exact: true });
    await bell.click(); await page.keyboard.press('Escape');
    assert.equal(await bell.getAttribute('aria-expanded'), 'false');
    assert(await bell.evaluate(node => node === document.activeElement));
    assert(await page.locator('.crew-artwork img').evaluate(img => img.complete && img.naturalWidth > 0 && getComputedStyle(img).animationName === 'none'));
    await page.locator('.weekly-history').click();
    assert.match(await page.locator('#qa-action').textContent(), /History opened/);
    await page.locator('.journey-preview').click();
    await page.getByRole('dialog', { name: 'A world to row.' }).waitFor();
    await page.keyboard.press('Escape');
    assert(await page.locator('.journey-preview').evaluate(node => node === document.activeElement));
    passed.push('skip link, notifications Escape/focus, reduced motion, image, logbook callback, map focus return');

    await tab('Crew');
    const search = page.getByRole('searchbox', { name: 'Find a rower, group, or challenge' });
    await search.fill('Sam'); assert.equal(await page.getByRole('article').count(), 2);
    await search.fill('Nobody with this name'); await page.getByText('No matching entries', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Clear rower search' }).click();
    const session = page.getByRole('article').first();
    const profile = session.getByRole('button', { name: /View .* profile/ });
    await profile.focus(); await page.keyboard.press('Enter');
    assert.match(await page.locator('#qa-action').textContent(), /Profile opened/);
    const picker = session.getByRole('button', { name: 'Add a reaction' });
    await picker.click(); await page.keyboard.press('Escape'); assert(await picker.evaluate(node => node === document.activeElement));
    await picker.click(); await session.getByRole('button', { name: 'React with 👏' }).click();
    await session.getByRole('button', { name: '👏: 1 reactions' }).waitFor();
    await session.getByRole('button', { name: /Show comments/ }).click();
    const comment = session.getByRole('textbox', { name: 'Add a comment' });
    await comment.fill('Great rhythm, crew.');
    await page.evaluate(() => window.__rowcrewQA.holdWrites());
    await session.getByRole('button', { name: 'Post comment', exact: true }).click();
    assert(await session.getByRole('button', { name: 'Posting comment' }).isDisabled());
    await page.evaluate(() => window.__rowcrewQA.releaseWrites());
    await session.getByText('Great rhythm, crew.', { exact: true }).waitFor();
    assert.equal(await comment.inputValue(), '');
    await comment.fill('Keep this draft.');
    await page.evaluate(() => window.__rowcrewQA.holdWrites());
    await session.getByRole('button', { name: 'Post comment', exact: true }).click();
    await page.evaluate(() => window.__rowcrewQA.failWrites());
    await session.getByRole('alert').waitFor(); assert.equal(await comment.inputValue(), 'Keep this draft.');
    passed.push('feed search/reset, keyboard profile, reaction/focus, pending comment guard, rejected-fixture draft retention');

    await tab('Board');
    const boardSearch = page.getByRole('searchbox', { name: 'Find a rower' });
    await boardSearch.fill('Jordan'); assert.equal(await page.locator('.crew-board-list li').count(), 1);
    await boardSearch.fill('');
    for (const name of ['This week', 'Streaks', 'Awards', 'Records']) await page.getByRole('group', { name: 'Leaderboard view' }).getByRole('button', { name }).click();
    const setup = page.getByRole('combobox', { name: 'Recorded setup' });
    const options = await setup.locator('option').allTextContents(); assert(options.length >= 2);
    const hydrow = await setup.locator('option').evaluateAll(nodes => nodes.find(n => n.textContent.includes('Hydrow')).value);
    await setup.selectOption(hydrow); assert.equal(await page.locator('.crew-board-list li').count(), 1);
    assert.match(await page.locator('.crew-board-list').textContent(), /Jordan Lee/);
    passed.push('leaderboard search, all views, machine-separated records');

    await tab('Progress');
    assert(await page.locator('.analytics-week-chart').isVisible());
    await page.getByRole('button', { name: '12 weeks', exact: true }).click();
    assert.equal(await page.locator('.analytics-week').count(), 12);
    await page.locator('.analytics-week').first().click();
    assert.equal(await page.locator('.analytics-week').first().getAttribute('aria-pressed'), 'true');
    await page.getByText('View weekly numbers', { exact: true }).click();
    assert.equal(await page.locator('.analytics-volume tbody tr').count(), 12);
    await page.getByRole('button', { name: 'All badges', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Find a badge' }).fill('No such badge');
    await page.getByText('No badges match these filters. Try another name or category.').waitFor();
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    const badge = page.locator('.progress-badge-card').first();
    await badge.click(); await page.getByRole('dialog').waitFor(); await page.keyboard.press('Escape');
    assert(await badge.evaluate(node => node === document.activeElement));
    passed.push('visible chart, 12-week selection/table, badge search/reset/details/focus');

    await tab('Home');
    const before = await page.evaluate(() => window.__rowcrewQA.snapshot().totalMeters);
    await page.locator('.dashboard-log').click();
    const log = page.getByRole('dialog', { name: 'Log your row' });
    await log.getByRole('button', { name: 'Manual', exact: true }).click();
    await log.getByLabel('Distance meters', { exact: true }).fill('1000');
    await log.getByRole('button', { name: 'Log 1,000 m', exact: true }).click();
    await log.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => window.__rowcrewQA.snapshot().totalMeters), before + 1000);
    passed.push('manual entry updates in-memory totals');

    await open('?empty=1&tab=feed'); assert.equal(await page.locator('.feed-skeleton').count(), 0);
    await page.getByRole('button', { name: 'All activity', exact: true }).click();
    await page.getByText('No entries yet', { exact: true }).waitFor();
    await open('?guest=1'); assert.equal(await page.getByRole('button', { name: 'Add a reaction' }).count(), 0);
    await tab('Progress'); await page.getByRole('button', { name: 'Sign in to track your rows' }).waitFor();
    await open('?loading=1&tab=feed'); await page.getByText('Loading crew activity…', { exact: true }).waitFor();
    await page.evaluate(() => window.__rowcrewQA.setIsLoading(false));
    await page.getByRole('article').first().waitFor();
    passed.push('empty, guest and loading states');

    await page.emulateMedia({ reducedMotion: 'no-preference' }); await open('');
    await page.waitForTimeout(2100);
    assert.equal(await page.locator('.crew-artwork img').evaluate(img => img.getAnimations().some(animation => animation.playState === 'running')), false);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    for (const name of ['Home', 'Crew', 'Board', 'Progress']) {
      await tab(name);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} overflow at 200% zoom`);
    }
    passed.push('bounded motion and 200% zoom');
    assert.deepEqual(errors, []); assert.deepEqual(blocked, []);
    const result = { status: 'passed', passed, pageErrors: errors, unexpectedRemoteRequests: blocked };
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(error => { fs.writeFileSync(resultPath, JSON.stringify({ status: 'failed', error: error.message }, null, 2)); console.error(error); process.exitCode = 1; });
