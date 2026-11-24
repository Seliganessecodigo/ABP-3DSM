const { createRequire } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const localRequire = createRequire(path.resolve(__dirname, '../../../frontend/package.json'));
const { chromium, expect } = localRequire('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const observed = { version: browser.version(), startedAt: new Date().toISOString(), widths: [] };
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', recordVideo: { dir: __dirname } });
      const page = await context.newPage();
      let navigations = 0;
      const responses = [];
      page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
      page.on('response', response => { if (response.url().includes('/api/')) responses.push({ url: response.url(), status: response.status() }); });
      await page.clock.install();
      await page.goto('http://127.0.0.1:4320/applications');
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.getByText(`QA Nova ${width}`, { exact: true })).toHaveCount(0);
      await page.screenshot({ path: path.join(__dirname, `ct014-antes-${width}.png`), fullPage: true });
      const countBefore = navigations;
      const advance = await fetch(`http://127.0.0.1:4318/advance/${width}`, { method: 'POST' });
      if (!advance.ok) throw new Error(`Fixture advance failed: ${advance.status}`);
      await page.clock.fastForward(61000);
      await expect(page.getByText(`QA Nova ${width}`, { exact: true }).filter({visible:true}).first()).toBeVisible({ timeout: 15000 });
      expect(navigations).toBe(countBefore);
      await page.screenshot({ path: path.join(__dirname, `ct014-descoberta-sem-reload-${width}.png`), fullPage: true });
      await page.goto(`http://127.0.0.1:4320/services/qa-ui-${width}`);
      await expect(page.getByText(`QA Nova ${width}`, { exact: true }).first()).toBeVisible();
      await page.screenshot({ path: path.join(__dirname, `ct014-detalhe-${width}.png`), fullPage: true });
      await page.goto(`http://127.0.0.1:4320/history?applicationId=qa-ui-${width}&period=24h`);
      await expect(page.locator('main h1')).toBeVisible();
      await page.screenshot({ path: path.join(__dirname, `ct014-historico-${width}.png`), fullPage: true });
      observed.widths.push({ width, height: width === 390 ? 844 : 900, discoveryWithoutReload: true, navigationsBeforeDiscovery: countBefore, responses });
      const video = page.video();
      await context.close();
      await video.saveAs(path.join(__dirname, `ct014-jornada-${width}.webm`));
      await video.delete();
    }
  } finally {
    fs.writeFileSync(path.join(__dirname, 'browser-observado.json'), JSON.stringify(observed, null, 2));
    await browser.close();
  }
  console.log(JSON.stringify(observed));
})().catch(error => { console.error(error); process.exitCode = 1 });
