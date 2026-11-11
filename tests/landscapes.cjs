const {chromium} = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
  try {
    const page = await browser.newPage();
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:8000/bird-explorer/');
    const result = await page.evaluate(async () => {
      const {renderBadge} = await import('./js/badge.js');
      const {BADGE_DESIGN: design} = await import('./js/badge-design.js');
      const bird = (await (await fetch('./data/species.json')).json())[0];
      // In-memory colored rectangles test compositing, not landscape artwork.
      const fixture = (width, height, color) => {
        const c = document.createElement('canvas'); c.width=width; c.height=height;
        c.naturalWidth=width; c.naturalHeight=height;
        if(color) { const ctx=c.getContext('2d'); ctx.fillStyle=color; ctx.fillRect(0,0,width,height); }
        return c;
      };
      const calls=[];
      const landscape=fixture(1000,590,'#ff0000'), transparent=fixture(200,100);
      const canvas=document.createElement('canvas');
      let text=[]; const ctx=canvas.getContext('2d'), original=ctx.fillText.bind(ctx);
      ctx.fillText=(value,...args)=>{text.push(value); original(value,...args);};
      const details={area:'limestone-canyon',location:'Limestone Canyon',date:'2026-11-05'};
      let output=await renderBadge(canvas,bird,async source=>{calls.push(source);return source===bird.image?transparent:landscape;},details);
      const pixel=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data);
      const success={source:output.landscapeSource,calls:[...calls],center:pixel(540,395),edge:pixel(40,100),paper:pixel(0,0),text:[...text]};
      calls.length=0;
      output=await renderBadge(canvas,bird,async source=>{
        calls.push(source); if(source.includes('limestone-canyon'))throw Error('missing area');
        return source===bird.image?transparent:landscape;
      },details);
      const fallback={source:output.landscapeSource,calls:[...calls],birdMissing:output.imageMissing};
      output=await renderBadge(canvas,bird,async source=>{if(source===bird.image)return transparent;throw Error('missing landscape');},details);
      const missing={source:output.landscapeSource,pixel:pixel(540,395),size:output.blob.size};
      output=await renderBadge(canvas,bird,async()=>{throw Error('all missing');},details);
      const allMissing={birdMissing:output.imageMissing,size:output.blob.size};
      // A 2:1 transparent bird is contained in the configured box without cropping.
      const foreground=fixture(200,100);const f=foreground.getContext('2d');f.fillStyle='#00ff00';f.fillRect(0,0,20,100);f.fillRect(180,0,20,100);
      await renderBadge(canvas,{...bird,imagePlaceholder:false},async source=>{if(source===bird.image)return foreground;throw Error('no landscape');},details);
      return {success,fallback,missing,allMissing,foreground:{left:pixel(195,300),right:pixel(885,300),outside:pixel(540,115)},opacity:design.landscape.opacity};
    });
    assert.equal(result.success.source,'./assets/areas/limestone-canyon.webp');
    assert.deepEqual(result.success.calls,['./assets/areas/limestone-canyon.webp',(await page.evaluate(async()=>(await(await fetch('./data/species.json')).json())[0].image))]);
    assert.equal(result.opacity,.65);
    assert.deepEqual(result.success.paper,[247,245,237,255]);
    assert.deepEqual(result.success.edge,result.success.paper);
    assert(result.success.center[0]<110 && result.success.center[0]>70);
    // Grayscale compositing preserves the paper's small channel differences.
    assert(Math.abs((result.success.center[0]-result.success.center[1])-1)<=1);
    assert(result.success.text.includes('What bird did you see?'));
    assert(result.success.text.includes('Location: Limestone Canyon'));
    assert(result.success.text.includes('Possible identification • Not verified'));
    assert.equal(result.fallback.source,'./assets/areas/default.webp');
    assert.equal(result.fallback.birdMissing,false);
    assert.equal(result.missing.source,null); assert.deepEqual(result.missing.pixel,result.success.paper);
    assert(result.missing.size>1000 && result.allMissing.size>1000 && result.allMissing.birdMissing);
    assert.deepEqual(result.foreground.left,[0,255,0,255]);
    assert.deepEqual(result.foreground.right,[0,255,0,255]);
    assert.deepEqual(result.foreground.outside,result.success.paper);
    const requests=[];
    await page.route('**/assets/areas/*.webp', route => {
      requests.push(new URL(route.request().url()).pathname.split('/').pop());
      return route.fulfill({status:404,body:''});
    });
    await page.goto((process.env.TEST_URL || 'http://127.0.0.1:8000/bird-explorer/')+'?area=weir-canyon');
    await page.locator('#find-bird').click();
    await page.locator('.species-card').first().click();
    requests.length=0;
    await page.getByRole('button',{name:'Create My Badge'}).click();
    const ready=()=>page.waitForFunction(()=>!document.querySelector('#download').disabled);
    await ready(); assert.deepEqual([...new Set(requests)],['weir-canyon.webp','default.webp']);
    requests.length=0;
    await page.locator('#discovery-area').selectOption('red-rock');await ready();
    assert.deepEqual([...new Set(requests)],['red-rock.webp','default.webp']);
    for (const value of ['other','']) {
      requests.length=0;await page.locator('#discovery-area').selectOption(value);await ready();
      assert.deepEqual([...new Set(requests)],['default.webp']);
    }
    console.log('Landscape checks passed: selected and default assets, missing-image exports, grayscale/opacity/fade pixels, transparent foreground and preserved proportions, and badge text.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
