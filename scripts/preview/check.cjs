// Set PLAYWRIGHT_MODULE to an existing Playwright package when it is not installed locally.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = path.resolve(__dirname, '../../artifacts/preview-checks');
fs.mkdirSync(output, { recursive: true });
const resultPath = path.join(output, 'result.json');
fs.writeFileSync(resultPath, JSON.stringify({ status: 'running' }));
const errors = [], blocked = [], passed = [], geometry = [];

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
      blocked.push(url.origin); return route.abort();
    });
    const settle = () => page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const open = async query => { await page.goto('http://127.0.0.1:3117/' + query, { waitUntil: 'networkidle' }); await settle(); };
    const tab = name => page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name, exact: true }).click();

    // Measure the untouched first screen: no scrolling, expanded panels, or
    // fixture adjustments are allowed to make the content fit.
    for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 740 }]) {
      await page.setViewportSize(viewport);
      await open('');
      const home = await page.evaluate(() => {
        const rect = selector => {
          const { top, bottom, left, right, width, height } = document.querySelector(selector).getBoundingClientRect();
          return { top, bottom, left, right, width, height };
        };
        const panels = [...document.querySelector('.dashboard').children].filter(node =>
          !node.classList.contains('dashboard-heading') && node.getBoundingClientRect().height > 0);
        return { screen: 'home', width: innerWidth, height: innerHeight, scrollY,
          nav: rect('.crew-nav'), hero: rect('.world-journey'), distance: rect('.world-journey-distance'),
          explore: rect('.world-journey-explore'), firstPanelIsJourney: panels[0].classList.contains('world-journey'),
          otherPanelTops: panels.slice(1).map(node => node.getBoundingClientRect().top) };
      });
      geometry.push(home);
      await page.screenshot({ path: path.join(output, `home-${viewport.width}x${viewport.height}.png`) });
      assert.equal(home.scrollY, 0, `Home initial scroll at ${viewport.width}px: ${JSON.stringify(home)}`);
      assert(home.firstPanelIsJourney && home.otherPanelTops.every(top => top >= home.hero.bottom),
        `World journey must lead the dashboard: ${JSON.stringify(home)}`);
      for (const name of ['distance', 'explore']) {
        const box = home[name];
        assert(box.width > 0 && box.height > 0 && box.top >= 0 && box.bottom <= home.nav.top && box.left >= 0 && box.right <= viewport.width,
          `Home ${name} must be fully above navigation: ${JSON.stringify(home)}`);
      }

      await tab('Crew'); await settle();
      const feed = await page.evaluate(() => {
        const rect = selector => {
          const { top, bottom, left, right, width, height } = document.querySelector(selector).getBoundingClientRect();
          return { top, bottom, left, right, width, height };
        };
        return { screen: 'crew', width: innerWidth, height: innerHeight, scrollY,
          nav: rect('.crew-nav'), firstSession: rect('article.feed-item-row'),
          heading: rect('.feed-heading'), tools: rect('.crew-log-tools'),
          goalClosed: !document.querySelector('.crew-pulse-panel').open };
      });
      geometry.push(feed);
      await page.screenshot({ path: path.join(output, `crew-${viewport.width}x${viewport.height}.png`) });
      assert.equal(feed.scrollY, 0, `Crew initial scroll at ${viewport.width}px: ${JSON.stringify(feed)}`);
      assert(feed.goalClosed, 'The optional crew goal must start closed');
      assert(feed.firstSession.width > 0 && feed.firstSession.height > 0 && feed.firstSession.top >= feed.tools.bottom &&
        feed.firstSession.bottom <= feed.nav.top && feed.firstSession.left >= 0 && feed.firstSession.right <= viewport.width,
      `First real session must fit fully above navigation: ${JSON.stringify(feed)}`);
    }
    passed.push('390×844 and 320×740: world journey leads with distance/map visible; complete first real crew session above bottom navigation');
    await page.setViewportSize({ width: 390, height: 844 });
    await open('');
    await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'crew-main');
    const bell = page.getByRole('button', { name: 'Notifications', exact: true });
    await bell.click(); await page.keyboard.press('Escape');
    assert.equal(await bell.getAttribute('aria-expanded'), 'false');
    assert(await bell.evaluate(node => node === document.activeElement));
    assert(await page.locator('.world-journey-art img').evaluate(img => img.complete && img.naturalWidth > 0 && getComputedStyle(img).animationName === 'none'));
    await page.locator('.weekly-history').click();
    assert.match(await page.locator('#qa-action').textContent(), /History opened/);
    await page.locator('.world-journey-explore').click();
    await page.getByRole('dialog', { name: 'A world to row.' }).waitFor();
    await page.keyboard.press('Escape');
    assert(await page.locator('.world-journey-explore').evaluate(node => node === document.activeElement));
    passed.push('skip link, notifications Escape/focus, reduced motion, image, logbook callback, map focus return');

    await tab('Crew');
    const search = page.getByRole('searchbox', { name: 'Find a rower, group, or challenge' });
    await search.fill('Sam'); assert.equal(await page.getByRole('article').count(), 2);
    await search.fill('Nobody with this name'); await page.getByText('No matching entries', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Clear rower search' }).click();
    const session = page.getByRole('article').first();
    const profile = session.getByRole('button', { name: /View .* profile/ });
    await profile.focus(); await page.keyboard.press('Enter');
    const profileDialog = page.locator('.user-profile-modal');
    await profileDialog.waitFor();
    assert.equal(await profileDialog.getAttribute('role'), 'dialog');
    assert(await profileDialog.getByRole('button', { name: 'Close rower profile' }).evaluate(node => node === document.activeElement));
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
    await page.keyboard.press('Escape'); await profileDialog.waitFor({ state: 'hidden' });
    assert(await profile.evaluate(node => node === document.activeElement));
    assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden');
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

    const crewGoal = page.locator('.crew-pulse-panel');
    const goalToggle = crewGoal.locator(':scope > summary');
    assert.equal(await crewGoal.getAttribute('open'), null);
    await goalToggle.focus(); await page.keyboard.press('Enter');
    assert.equal(await crewGoal.evaluate(node => node.open), true);
    const beforeKudos = await page.evaluate(() => window.__rowcrewQA.snapshot().reactions);
    const kudos = crewGoal.getByRole('button', { name: /Give kudos to/ });
    await kudos.click();
    const undoKudos = crewGoal.getByRole('button', { name: /Remove kudos from/ });
    await undoKudos.waitFor();
    const afterKudos = await page.evaluate(() => window.__rowcrewQA.snapshot());
    const addedKudos = afterKudos.reactions.filter(reaction => !beforeKudos.some(previous => previous.id === reaction.id));
    assert.equal(addedKudos.length, 1);
    assert.equal(addedKudos[0].emoji, '👏');
    assert(afterKudos.entries.some(entry => entry.id === addedKudos[0].targetId), 'Kudos must bind to a real fixture session');
    await undoKudos.click(); await kudos.waitFor();
    assert.equal(await page.evaluate(id => window.__rowcrewQA.snapshot().reactions.some(reaction => reaction.id === id), addedKudos[0].id), false);
    await goalToggle.focus(); await page.keyboard.press('Enter');
    assert.equal(await crewGoal.evaluate(node => node.open), false);
    assert(await goalToggle.evaluate(node => node === document.activeElement));
    passed.push('optional crew disclosure keyboard/focus, exact-session kudos and undo');

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

    // Deliberately stale stored counters must never leak into the real profile
    // or the map. The fixture still derives all metrics from its actual rows.
    await open('?stale=1&tab=leaderboard');
    const staleSnapshot = await page.evaluate(() => window.__rowcrewQA.snapshot());
    assert.equal(staleSnapshot.users['crew-3'].totalMeters, 999999);
    assert.equal(staleSnapshot.metricUsers['crew-3'].totalMeters, 5000);
    assert.equal(staleSnapshot.totalMeters, 28250);
    const jordanProfile = page.locator('.crew-board-row').filter({ hasText: 'Jordan Lee' });
    await jordanProfile.click();
    const jordanDialog = page.getByRole('dialog', { name: 'Jordan Lee', exact: true });
    await jordanDialog.waitFor();
    assert.equal(await jordanDialog.locator('.profile-stat-value').nth(0).textContent(), '5.0k');
    assert.equal(await jordanDialog.locator('.profile-stat-value').nth(1).textContent(), '2');
    assert.match(await jordanDialog.locator('.profile-modal-rank').textContent(), /Deckhand/);
    assert.match(await jordanDialog.locator('.profile-secondary-stats').textContent(), /Rowing since/);
    assert.doesNotMatch(await jordanDialog.textContent(), /999,999|999999|1000\.0k/);
    const remainingBadges = jordanDialog.locator('.profile-badges-remaining summary');
    await page.keyboard.press('Shift+Tab');
    assert(await remainingBadges.evaluate(node => node === document.activeElement));
    await page.keyboard.press('Tab');
    assert(await jordanDialog.getByRole('button', { name: 'Close rower profile' }).evaluate(node => node === document.activeElement));
    await jordanDialog.screenshot({ path: path.join(output, 'derived-profile-390.png') });
    await page.keyboard.press('Escape'); await jordanDialog.waitFor({ state: 'hidden' });
    assert(await jordanProfile.evaluate(node => node === document.activeElement));
    const crewMapButton = page.getByRole('button', { name: 'Open crew map', exact: true });
    await crewMapButton.click();
    await page.getByRole('dialog', { name: 'A world to row.' }).waitFor();
    assert.equal(await page.locator('.exp-summary strong').first().textContent(), '28.3 km');
    await page.getByRole('button', { name: 'The crew', exact: true }).click();
    const jordanContribution = page.locator('.exp-member').filter({ hasText: 'Jordan Lee' });
    assert.equal(await jordanContribution.locator('.exp-member-distance strong').textContent(), '5 km');
    assert.equal(await jordanContribution.locator('.exp-member-distance small').textContent(), '17.7%');
    assert.equal(await jordanContribution.locator('.exp-member-info small').textContent(), 'Deckhand');
    assert.equal(await page.locator('.exp-member').count(), 3);
    await page.keyboard.press('Escape');
    assert(await crewMapButton.evaluate(node => node === document.activeElement));
    passed.push('actual profile dialog keyboard/scroll/focus and map totals/ranks/shares ignore stale stored counters');

    await tab('Progress');
    assert(await page.locator('.analytics-week-chart').isVisible());
    await page.getByRole('button', { name: '12 weeks', exact: true }).click();
    assert.equal(await page.locator('.analytics-week').count(), 12);
    await page.locator('.analytics-week').first().click();
    assert.equal(await page.locator('.analytics-week').first().getAttribute('aria-pressed'), 'true');
    await page.getByText('View weekly numbers', { exact: true }).click();
    assert.equal(await page.locator('.analytics-volume tbody tr').count(), 12);
    const paceHistory = page.locator('.analytics-pace-history');
    assert(await paceHistory.isVisible());
    assert.equal(await paceHistory.locator('.analytics-pace-dot').count(), 2);
    assert.match(await page.locator('.analytics-pace-plot').getAttribute('aria-label'), /First 2:15\.0, latest 2:07\.5 per 500 meters/);
    assert.match(await page.locator('.analytics-pace-change').textContent(), /7\.5 sec \/ 500m quicker/);
    assert(await paceHistory.locator('polyline').evaluate(node => node.getAttribute('points').split(/[ ,]+/).map(Number).every(Number.isFinite)));
    await page.getByText('View benchmark rows', { exact: true }).click();
    assert.equal(await page.locator('.analytics-benchmark tbody tr').count(), 2);
    assert.match(await page.locator('.analytics-benchmark tbody tr').first().textContent(), /9:002:15\.0/);
    assert.match(await page.locator('.analytics-benchmark tbody tr').last().textContent(), /8:302:07\.5/);
    await page.locator('.analytics-benchmark').screenshot({ path: path.join(output, 'pace-history-390.png') });
    await page.getByRole('button', { name: 'All badges', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Find a badge' }).fill('No such badge');
    await page.getByText('No badges match these filters. Try another name or category.').waitFor();
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    const badge = page.locator('.progress-badge-card').first();
    await badge.click(); await page.getByRole('dialog').waitFor(); await page.keyboard.press('Escape');
    assert(await badge.evaluate(node => node === document.activeElement));
    passed.push('visible chart, 12-week selection/table, exact-setup pace history/table, badge search/reset/details/focus');

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
    assert.equal(await page.locator('.world-journey-art img').evaluate(img => img.getAnimations().some(animation => animation.playState === 'running')), false);
    const perpetualAnimations = await page.evaluate(() => document.getAnimations().filter(animation =>
      animation.playState === 'running' && animation.effect?.getTiming().iterations === Infinity).map(animation => ({
      name: animation.animationName || 'unnamed', target: animation.effect.target?.className || 'unknown',
    })));
    assert.deepEqual(perpetualAnimations, [], 'The first screen must not run perpetual animations');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    for (const name of ['Home', 'Crew', 'Board', 'Progress']) {
      await tab(name);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} overflow at 200% zoom`);
    }
    passed.push('bounded motion and 200% zoom');
    assert.deepEqual(errors, []); assert.deepEqual(blocked, []);
    const result = { status: 'passed', passed, geometry, pageErrors: errors, unexpectedRemoteRequests: blocked };
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(error => { fs.writeFileSync(resultPath, JSON.stringify({ status: 'failed', error: error.message, passed, geometry, pageErrors: errors, unexpectedRemoteRequests: blocked }, null, 2)); console.error(error); process.exitCode = 1; });
