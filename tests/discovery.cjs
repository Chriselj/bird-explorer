const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.env.TEST_URL || 'http://127.0.0.1:8000/bird-explorer/';
(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport:{width:390,height:844}, timezoneId:'America/Los_Angeles', acceptDownloads:true});
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    // UTC is November 6; the visitor's local calendar date is still November 5.
    await page.addInitScript(() => {
      const NativeDate = Date, fixed = NativeDate.parse('2026-11-06T02:30:00Z');
      window.Date = class extends NativeDate {
        constructor(...args) { super(...(args.length ? args : [fixed])); }
        static now() { return fixed; }
      };
    });
    await page.addInitScript(() => {
      window.badgeText = [];
      const original = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function(text, ...args) {
        window.badgeText.push(text); return original.call(this, text, ...args);
      };
    });
    for (const [query, expected] of [['?area=limestone-canyon','limestone-canyon'],['?area=weir-canyon','weir-canyon'],['',''],['?area=invalid','']]) {
      await page.goto(base + query);
      assert.equal(await page.locator('#discovery-area').inputValue(), expected);
      assert.equal(await page.locator('#discovery-date').inputValue(), '2026-11-05');
    }
    await page.goto(base + '?area=limestone-canyon');
    await page.locator('#find-bird').click();
    await page.locator('.species-card').first().click();
    await page.getByRole('button',{name:'Create My Badge'}).click();
    const ready = () => page.waitForFunction(() => !document.querySelector('#download').disabled);
    await ready();
    assert((await page.evaluate(() => window.badgeText)).includes('Location: Limestone Canyon'));
    async function edit(action) {
      await page.evaluate(() => window.badgeText = []);
      await action(); await ready();
      return page.evaluate(() => window.badgeText);
    }
    let text = await edit(() => page.locator('#discovery-area').selectOption('weir-canyon'));
    assert(text.includes('Location: Weir Canyon'));
    text = await edit(() => page.locator('#discovery-area').selectOption(''));
    assert(!text.some(t => t.startsWith('Location:')));
    await edit(() => page.locator('#discovery-area').selectOption('other'));
    text = await edit(() => page.locator('#other-location').fill('Neighborhood park'));
    assert(text.includes('Location: Neighborhood park'));
    text = await edit(() => page.locator('#discovery-date').fill('2026-10-31'));
    assert(text.includes('Discovered: October 31, 2026'));
    assert(text.includes('Possible identification • Not verified'));
    await page.locator('#discovery-date').fill('');
    assert(await page.locator('#download').isDisabled());
    await edit(() => page.locator('#discovery-date').fill('2026-10-31'));
    // Most recent edit must win even if earlier image renders are still pending.
    await page.evaluate(() => {
      const area = document.querySelector('#discovery-area');
      for (const value of ['red-rock','gypsum-canyon','saddleback']) { area.value = value; area.dispatchEvent(new Event('change')); }
    });
    await ready();
    assert.match(await page.locator('#badge-canvas').getAttribute('aria-label'), /Location: Saddleback Wilderness/);
    // A download contains exactly the currently displayed canvas.
    const [download] = await Promise.all([page.waitForEvent('download'),page.locator('#download').click()]);
    const bytes = await fs.readFile(await download.path());
    const preview = await page.locator('#badge-canvas').evaluate(c => c.toDataURL().split(',')[1]);
    assert.deepEqual(bytes, Buffer.from(preview, 'base64'));
    assert.equal(bytes.readUInt32BE(16),1080); assert.equal(bytes.readUInt32BE(20),1080);
    await page.getByRole('button',{name:'Choose another bird'}).click();
    await page.locator('.species-card').nth(1).click();
    await page.getByRole('button',{name:'Create My Badge'}).click(); await ready();
    assert.equal(await page.locator('#discovery-area').inputValue(), 'saddleback');
    assert.equal(await page.locator('#discovery-date').inputValue(), '2026-10-31');
    await page.setViewportSize({width:320,height:740});
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    console.log('Discovery checks passed: URL defaults, manual changes/removal/custom areas, local and edited dates, invalid date guard, concurrent edits, identical PNG export, navigation persistence, and mobile layout.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
