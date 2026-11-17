const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('/Users/ns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const outputDir = path.join(__dirname, 'asset-gallery');
fs.mkdirSync(outputDir, { recursive: true });

const assets = [
  ['01-char-001-final', '/assets/scene-pack/source/CHAR-001/CHAR-001-animated.glb', 'front'],
  ['02-prop-011-buddha', '/assets/scene-pack/source/PROP-011/PROP-011.glb', 'front'],
  ['03-arch-012-roof-final', '/assets/scene-pack/source/ARCH-012/ARCH-012-clean.glb', 'side'],
  ['04-arch-016-gate-integrated', '/assets/scene-pack/source/ARCH-016/ARCH-016-integrated.glb', 'front'],
  ['05-arch-004-corridor-final', '/assets/scene-pack/source/ARCH-004/ARCH-004.glb', 'side'],
  ['06-arch-005-corner-corridor', '/assets/scene-pack/source/ARCH-005/ARCH-005.glb', 'top'],
  ['07-arch-006-wall', '/assets/scene-pack/source/ARCH-006/ARCH-006.glb', 'front'],
  ['08-arch-008-side-gate', '/assets/scene-pack/source/ARCH-008/ARCH-008.glb', 'front'],
  ['09-arch-010-stone-bridge', '/assets/scene-pack/source/ARCH-010/ARCH-010-clean.glb', 'side'],
  ['10-env-001-rock', '/assets/scene-pack/source/ENV-001/ENV-001.glb', 'front'],
  ['11-env-003-bamboo', '/assets/scene-pack/source/ENV-003/ENV-003.glb', 'front'],
  ['12-env-006-pine-final', '/assets/scene-pack/source/ENV-006/ENV-006.glb', 'front'],
  ['13-env-010-lotus', '/assets/scene-pack/source/ENV-010/ENV-010.glb', 'front'],
  ['14-prop-012-prayer-beads', '/assets/scene-pack/source/PROP-012/PROP-012.glb', 'front'],
  ['15-prop-013-wooden-fish', '/assets/scene-pack/source/PROP-013/PROP-013.glb', 'front'],
  ['16-prop-014-lantern', '/assets/scene-pack/source/PROP-014/PROP-014.glb', 'front'],
  ['17-rejected-arch-004-closed-end', '/assets/scene-pack/source/ARCH-004/rejected-attempt-01/ARCH-004.glb', 'side'],
  ['18-rejected-arch-012-hipped-roof', '/assets/scene-pack/source/ARCH-012/attempt-01-closed-but-hipped/ARCH-012.glb', 'side'],
  ['19-rejected-arch-015-stone-gate', '/assets/scene-pack/source/ARCH-015/ARCH-015.glb', 'front'],
  ['20-rejected-env-006-white-pine', '/assets/scene-pack/source/ENV-006/rejected-attempt-01/ENV-006.glb', 'front'],
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

  for (const [name, asset, view] of assets) {
    const url = `http://127.0.0.1:4174/asset-preview.html?asset=${encodeURIComponent(asset)}&view=${view}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => {
      const metrics = document.querySelector('#metrics')?.textContent || '';
      const error = document.querySelector('#error')?.textContent || '';
      return metrics.length > 0 || error.length > 0;
    }, null, { timeout: 60000 });

    const error = await page.locator('#error').textContent();
    if (error) {
      console.error(`${name}: ${error}`);
      continue;
    }

    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(outputDir, `${name}.png`) });
    console.log(`${name}.png`);
  }

  await browser.close();
})();
