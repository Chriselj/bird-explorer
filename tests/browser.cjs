/* Optional browser checks: npm install --no-save --package-lock=false playwright
   then npx playwright install chromium (or use CHROMIUM_PATH).
   Start the README's static server first; run node tests/browser.cjs. */
const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const baseURL = process.env.TEST_URL || 'http://127.0.0.1:8000/bird-explorer/';
async function run(browserType, options, label) {
  const browser = await browserType.launch(options);
  try {
    const page = await browser.newPage({ viewport: {width:390,height:844}, deviceScaleFactor:2, hasTouch:true, acceptDownloads:true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(baseURL);
    await page.getByRole('button',{name:'Identify with Merlin', exact:true}).click();
    assert.equal(await page.getByRole('link',{name:'Visit Merlin’s website'}).getAttribute('href'), 'https://merlin.allaboutbirds.org/');
    await page.getByRole('button',{name:'Close Merlin instructions'}).click();
    await page.getByRole('button',{name:'Find My Bird'}).click();
    await page.waitForFunction(() => document.querySelectorAll('.species-card').length === 5);
    await page.getByLabel('Search by common or scientific name').fill('towhee');
    assert.equal(await page.locator('.species-card').count(),2);
    await page.getByLabel('Search by common or scientific name').fill('Calypte anna');
    assert.equal(await page.locator('.species-card').count(),1);
    await page.locator('.species-card').click();
    await page.getByRole('button',{name:'Create My Badge'}).click();
    await page.waitForFunction(() => !document.getElementById('download').disabled);
    assert.match(await page.locator('#badge-status').textContent(), /ready/);
    const [download] = await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Download Badge',exact:true}).click()]);
    const bytes = await fs.readFile(await download.path());
    assert.equal(bytes.subarray(1,4).toString(),'PNG');
    assert.equal(bytes.readUInt32BE(16),1080); assert.equal(bytes.readUInt32BE(20),1080);
    await page.screenshot({path:`/tmp/bird-explorer-${label}-mobile-badge.png`,fullPage:true});
    // Native sharing success and cancellation, without invoking an OS sheet.
    await page.evaluate(() => {
      Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
      Object.defineProperty(navigator,'share',{configurable:true,value:async data=> { window.sharedBadge = {type:data.files[0].type,size:data.files[0].size}; }});
    });
    await page.getByRole('button',{name:'Share My Discovery'}).click();
    await page.waitForFunction(() => document.getElementById('badge-status').textContent === 'Sharing finished.');
    assert.equal((await page.evaluate(()=>window.sharedBadge)).type,'image/png');
    await page.evaluate(() => Object.defineProperty(navigator,'share',{configurable:true,value:async()=> {throw new DOMException('Canceled','AbortError');}}));
    await page.getByRole('button',{name:'Share My Discovery'}).click();
    await page.waitForFunction(() => document.getElementById('badge-status').textContent.includes('canceled'));
    await page.evaluate(() => Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));
    await page.getByRole('button',{name:'Share My Discovery'}).click();
    await page.waitForFunction(() => document.getElementById('badge-status').textContent.includes('does not support'));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
    // Every catalog entry can use the shared template.
    const outputs = await page.evaluate(async () => {
      const {renderBadge} = await import('./js/badge.js');
      const birds = await (await fetch('./data/species.json')).json();
      const results=[];
      for (const bird of birds) { const result=await renderBadge(document.createElement('canvas'),bird); results.push({missing:result.imageMissing,size:result.blob.size}); }
      return results;
    });
    assert.equal(outputs.length,5); assert(outputs.every(r=>!r.missing && r.size>10000));
    // A failed image still yields a valid labeled PNG.
    const fallback = await page.evaluate(async () => {
      const {renderBadge} = await import('./js/badge.js');
      const bird = (await (await fetch('./data/species.json')).json())[0];
      const result=await renderBadge(document.createElement('canvas'),bird,async()=>{throw new Error('Missing image');});
      return {missing:result.imageMissing,type:result.blob.type,size:result.blob.size};
    });
    assert(fallback.missing && fallback.type==='image/png' && fallback.size>1000);
    const renderedText = await page.evaluate(async () => {
      const {renderBadge} = await import('./js/badge.js');
      const bird = (await (await fetch('./data/species.json')).json())[0];
      const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d'), text = [];
      const fillText = ctx.fillText.bind(ctx);
      ctx.fillText = (...args) => { text.push(args[0]); return fillText(...args); };
      await renderBadge(canvas, bird);
      return text;
    });
    assert(renderedText.includes('Possible identification • Not verified'));
    assert(renderedText.includes('TEMPORARY ILLUSTRATION · NOT A PHOTOGRAPH'));
    await page.route('**/data/species.json', route=>route.fulfill({status:503,body:'Unavailable'}));
    await page.reload(); await page.getByRole('button',{name:'Find My Bird'}).click();
    await page.getByRole('button',{name:'Try loading again'}).waitFor();
    await page.unroute('**/data/species.json');
    await page.getByRole('button',{name:'Try loading again'}).click();
    await page.waitForFunction(()=>document.querySelectorAll('.species-card').length===5);
    await page.getByLabel('Search by common or scientific name').fill('no match');
    assert.equal(await page.locator('.species-card').count(),0);
    await page.getByLabel('Search by common or scientific name').fill('');
    await page.route('**/assets/birds/wrentit.svg',route=>route.abort());
    await page.locator('.species-card').first().click();
    await page.getByRole('button',{name:'Create My Badge'}).click();
    await page.waitForFunction(()=>!document.getElementById('download').disabled);
    assert.match(await page.locator('#badge-status').textContent(), /could not load/);
    await page.setViewportSize({width:320,height:740});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.setViewportSize({width:1440,height:1000});
    await page.screenshot({path:`/tmp/bird-explorer-${label}-badge.png`,fullPage:true});
    await page.goto(baseURL);
    await page.screenshot({path:`/tmp/bird-explorer-${label}-home.png`,fullPage:true});
    assert.deepEqual(errors,[]);
    console.log(`${label}: passed search, selection, five badge exports, PNG dimensions, download, share/fallback/cancel, catalog retry, image failure, subpath, narrow layout, and JS error checks`);
  } finally { await browser.close(); }
}
(async()=>{
  await run(chromium, {executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']},'chromium');
  if(process.env.TEST_WEBKIT==='1') await run(webkit,{},'webkit');
})().catch(error=>{console.error(error);process.exitCode=1;});
