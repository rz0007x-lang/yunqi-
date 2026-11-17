// Reproducible capture of the unmodified local application through real UI inputs.
const {chromium}=require('/Users/ns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
const path=require('path');
const out=path.join(__dirname,'video-work-v2');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'chromium',headless:true,args:['--enable-gpu','--use-gl=angle','--use-angle=metal','--autoplay-policy=no-user-gesture-required','--ignore-gpu-blocklist']});
 const system=await (await browser.newBrowserCDPSession()).send('SystemInfo.getInfo');
 console.log('GPU',JSON.stringify(system.gpu.devices));
 const context=await browser.newContext({viewport:{width:1920,height:960},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1920,height:960}}});
 await context.addInitScript(()=>{
   const original=AudioNode.prototype.connect;
   AudioNode.prototype.connect=function(destination,...args){
     const result=original.call(this,destination,...args);
     if(destination instanceof AudioDestinationNode){
       if(!window.captureAudio){window.captureAudio=this.context.createMediaStreamDestination();}
       original.call(this,window.captureAudio);
     }
     return result;
   };
 });
 const created=Date.now();
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173');
 await page.locator('#enter-button').waitFor({state:'visible',timeout:180000});
 await page.locator('#boot').waitFor({state:'detached',timeout:180000});
 await page.waitForTimeout(14000);
 await page.locator('#enter-button').click();
 await page.waitForTimeout(6000);
 // Sound capture is a tap on the application's real output, with no synthesized replacement.
 await page.evaluate(()=>{
   window.captureChunks=[];
   window.audioRecorder=new MediaRecorder(window.captureAudio.stream,{mimeType:'audio/webm;codecs=opus'});
   window.audioRecorder.ondataavailable=e=>window.captureChunks.push(e.data);
   window.audioRecorder.start();
 });
 const started=Date.now();
 let scheduleOffset=0;
 const events=[];
 async function at(seconds,label,fn){
   const delay=(seconds+scheduleOffset)*1000-(Date.now()-started);if(delay>0)await page.waitForTimeout(delay);
   events.push({time:(Date.now()-started)/1000,label});console.log(label,events.at(-1).time);
   if(fn)await fn();
 }
 const click=s=>page.locator(s).click();
 async function drag(dx){await page.mouse.move(1050,470);await page.mouse.down();for(let i=1;i<=60;i++){await page.mouse.move(1050+dx*i/60,470);await page.waitForTimeout(25);}await page.mouse.up();}
 await at(0,'山门');
 await at(9,'穿过山门',()=>click('[data-scene-view="courtyard"]'));
 await at(23,'云庭环视',()=>drag(55));
 await at(30,'云庭视角回正',()=>drag(-55));
 await at(37,'步入大殿',()=>click('[data-scene-view="hall"]'));
 await page.waitForFunction(()=>window.__YUNQI_DIAGNOSTICS__().playerPosition[2]<8.65,{},{timeout:180000,polling:1000});
 scheduleOffset=Math.max(0,(Date.now()-started)/1000-46);
 console.log('抵达大殿，额外行走时间',scheduleOffset);
 await at(48,'合掌',()=>click('[data-action="gassho"]'));
 await at(55,'礼拜',()=>click('[data-action="bow"]'));
 await at(64,'念珠',()=>click('[data-action="beads"]'));
 for(const t of [68,70,72])await at(t,'转动一珠',()=>click('#beads-turn'));
 await at(76,'关闭念珠',()=>click('#beads-dialog [data-close-dialog]'));
 await at(78,'木鱼',()=>click('[data-action="moktak"]'));
 for(const t of [82,84,86])await at(t,'敲击木鱼',()=>click('#moktak-strike'));
 await at(90,'关闭木鱼',()=>click('#moktak-dialog [data-close-dialog]'));
 await at(92,'静坐',()=>click('[data-action="meditate"]'));
 await at(95,'选择一分钟',()=>click('[data-minutes="1"]'));
 await at(97,'开始静坐',()=>click('#timer-toggle'));
 await at(106,'返回大殿',()=>click('#meditate-dialog [data-close-dialog]'));
 await at(111,'云庭回望',()=>click('[data-scene-view="courtyard"]'));
 await at(118,'山门收尾',()=>click('[data-scene-view="gate"]'));
 await at(126,'结束');
 const audio=await page.evaluate(async()=>{
   await new Promise(resolve=>{window.audioRecorder.onstop=resolve;window.audioRecorder.stop()});
   const buffer=await new Blob(window.captureChunks).arrayBuffer();
   let binary='';for(const b of new Uint8Array(buffer))binary+=String.fromCharCode(b);
   return btoa(binary);
 });
 fs.writeFileSync(path.join(out,'runtime-audio.webm'),Buffer.from(audio,'base64'));
 const diagnostics=await page.evaluate(()=>window.__YUNQI_DIAGNOSTICS__());
 const video=page.video();
 await context.close();
 await video.saveAs(path.join(out,'runtime-raw.webm'));
 fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({trimStart:(started-created)/1000,duration:126+scheduleOffset,scheduleOffset,events,errors,diagnostics,gpu:system.gpu.devices},null,2));
 await browser.close();
})();
