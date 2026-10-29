// Optional integration check: requires Playwright and installed Microsoft Edge.
// Run: node tests/browser-smoke.cjs
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', m => { if (m.type() === 'error' && /gameLoop|\[loop\]/.test(m.text())) errors.push(m.text()); });
        await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
        await page.evaluate(() => { startCampaign(true); base.gate = 5; admJump(5, 'base'); });
        await page.waitForTimeout(1200);
        const state = await page.evaluate(() => ({ mode: objState, gates: base.def.gates, barriers: base.def.barriers.length, hp: base.def.houseNpc.hp }));
        assert.equal(state.mode, 'BASE_DEF'); assert.equal(state.gates, 2); assert.equal(state.barriers, 2); assert.ok(state.hp > 0);
        await page.evaluate(() => {
            loopToken++; // Advance simulation deterministically for the rest of the check.
            story.dialog = null; story.intro = null;
            for (let i = 0; i < 900; i++) gameLoop(lastTime + 1000 / 60);
            draw();
        });
        const result = await page.evaluate(() => ({ wave: base.def.wave, liveGates: base.def.barriers.filter(b => b.hp > 0).length }));
        assert.ok(result.wave >= 1);
        await page.screenshot({ path: path.join(require('node:os').tmpdir(), 'zombie-defense-smoke.png') });
        await page.evaluate(() => { enterHub(); loopToken++; shopScrap = 1000; base.mat = 100; base.gate = 0; renderBasePanel(); });
        assert.ok((await page.locator('#baseItems').textContent()).includes('Cửa Chắn'));
        for (let i = 0; i < 5; i++) await page.evaluate(() => baseBuy('gate'));
        assert.equal(await page.evaluate(() => base.gate), 5);
        await page.evaluate(() => { toggleGuideModal(true); });
        assert.ok((await page.locator('#guideModal').textContent()).includes('Huyết Giáp'));
        assert.deepEqual(errors, []);
        console.log('PASS: real browser startup, 2-gate defense, 15s simulation, rendering, five gate purchases, upgrade wiki.');
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
