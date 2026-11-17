const {chromium}=require('/Users/ns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:false});
 const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>console.log('ERROR',e.message));
 await page.goto('http://127.0.0.1:4173');
 await page.locator('#enter-button').waitFor({state:'visible',timeout:180000});
 await page.locator('#enter-button').click();
 await page.waitForTimeout(12000);
 await page.screenshot({path:__dirname+'/video-probe.png'});
 console.log(await page.evaluate(()=>window.__YUNQI_DIAGNOSTICS__()));
 await browser.close();
})();
