const {chromium}=require('/Users/ns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
for(const mode of ['default','metal','gl']){
 const browser=await chromium.launch({headless:true,args:mode==='default'?[]:[`--use-angle=${mode}`]});
 const page=await browser.newPage({viewport:{width:1280,height:640}});
 const cdp=await browser.newBrowserCDPSession();
 const gpu=await cdp.send('SystemInfo.getInfo');
 console.log(mode,JSON.stringify(gpu.gpu.devices));
 await page.goto('http://127.0.0.1:4173');
 await page.locator('#enter-button').waitFor({timeout:120000});await page.locator('#enter-button').click();
 await page.waitForTimeout(7000);
 const fps=await page.evaluate(()=>new Promise(resolve=>{let n=0;const start=performance.now();function step(){n++;if(performance.now()-start>5000)resolve(n*1000/(performance.now()-start));else requestAnimationFrame(step);}requestAnimationFrame(step)}));
 console.log(mode,'FPS',fps);
 await browser.close();
}
})();
