const {chromium}=require('/Users/ns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({channel:'chromium',headless:true});
 try{
  const page=await browser.newPage();
  const url='https://upload.wikimedia.org/wikipedia/commons/5/5a/Bore_Xinjing_%E8%88%AC%E8%8B%A5%E5%BF%83%E7%BB%8F_%28Heart_Sutra%29_in_Mandarin_recited_by_a_Chinese_Buddhist_layperson.ogg';
  await page.goto('https://commons.wikimedia.org/',{waitUntil:'domcontentloaded',timeout:45000});
  const audio=await page.evaluate(async url=>{
    const response=await fetch(url);if(!response.ok)throw new Error('HTTP '+response.status);
    const bytes=new Uint8Array(await response.arrayBuffer());
    let str='';for(const b of bytes)str+=String.fromCharCode(b);
    return btoa(str);
  },url);
  fs.writeFileSync(__dirname+'/video-work-v3/heart-sutra-cc0.ogg',Buffer.from(audio,'base64'));
  console.log('Audio downloaded');
 }finally{await browser.close()}
})();
