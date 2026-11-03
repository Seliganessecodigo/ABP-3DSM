import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(resolve(process.argv[2] ?? resolve(here, '../../frontend'), 'package.json'))
const { chromium } = require('@playwright/test')
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(pathToFileURL(resolve(here, process.argv[3] ?? 'motion-v3.html')).href + '?render')
  await page.evaluate(() => window.ready)
  const defects = []
  // The v2 mixes partially exposed screenshots inside one changing crop.
  for (const t of [2.525, 5.15, 7.6, 9.85]) {
    await page.evaluate(t => window.draw(t), t)
    const mixed = await page.evaluate(() => {
      const frame = document.querySelector('#handoff')
      if (!frame || Number(getComputedStyle(frame).opacity) < .1) return false
      return [...frame.querySelectorAll('img')].filter(img => Number(getComputedStyle(img).opacity) > .1 && img.currentSrc).length > 1
    })
    if (mixed) defects.push(`${t}s: two screenshots exposed inside one crop`)
  }
  await page.evaluate(() => window.draw(.7))
  const clipped = await page.evaluate(() => {
    const caption = document.querySelector('#caption') ?? document.querySelector('#a .caption')
    return caption && caption.getBoundingClientRect().top < 0
  })
  if (clipped) defects.push('0.7s: opening title outside the frame')
  assert.deepEqual(defects, [], 'Visible composition defects')
  // V3 also checks temporal continuity and the edge-on texture exchange.
  if (await page.evaluate(() => Boolean(window.motionChecks))) {
    for (const at of await page.evaluate(() => window.transitionTimes)) {
      const before = await page.evaluate(t => window.draw(t - .0001), at)
      const after = await page.evaluate(t => window.draw(t + .0001), at)
      assert.notEqual(before.scene, after.scene, 'Texture must change at the turn')
      assert(Math.abs(before.rotation - 90) < .03 && Math.abs(after.rotation + 90) < .03, 'Texture exchange must be edge-on')
      assert(Math.abs(before.x - after.x) < .5 && Math.abs(before.y - after.y) < .5, 'Subject must not jump at the exchange')
    }
    for (let t = 0; t <= 14; t += 1 / 30) {
      const state = await page.evaluate(t => window.draw(t), t)
      assert(Object.values(state).every(value => typeof value !== 'number' || Number.isFinite(value)))
      assert.equal(state.visibleTextures, 1)
    }
    for (const at of [1.2,3.2,4.1,6.1,7,9,9.9,11.9]) {
      const before = await page.evaluate(t => window.draw(t-.0001), at)
      const after = await page.evaluate(t => window.draw(t+.0001), at)
      assert(Math.abs(before.scale-after.scale)<.001, 'Scale must remain continuous at shot boundaries')
      assert(Math.abs(before.textureProgress-after.textureProgress)<.001, 'Screenshot scrolling must remain continuous at shot boundaries')
      assert(Math.abs(before.x-after.x)<.5 && Math.abs(before.y-after.y)<.5, 'Position must remain continuous at shot boundaries')
    }
    for (const at of [.7,3.65,6.55,9.45,12.9]) {
      await page.evaluate(t=>window.draw(t),at)
      const bounds = await page.locator('#subject').boundingBox()
      assert(bounds.x>=0 && bounds.y>=0 && bounds.x+bounds.width<=1920 && bounds.y+bounds.height<=1080, 'Settled device must remain fully in frame')
    }
  }
  assert.deepEqual(errors, [])
  console.log('PASS: no mixed screenshot crop or clipped opening title; continuous exchanges; one texture per frame; no JavaScript errors.')
} finally { await browser.close() }
