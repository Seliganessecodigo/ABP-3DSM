import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { once } from 'node:events'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, 'output')
const require = createRequire(resolve(process.argv[2] ?? resolve(here, '../../frontend'), 'package.json'))
const { chromium } = require('@playwright/test')
const ffmpeg = process.argv[3] ?? 'ffmpeg'
const fps = 30, seconds = 26, rate = 48000
await mkdir(out, { recursive: true })

function soundtrack(transitionTimes) {
  const samples = new Float64Array(rate * seconds)
  let seed = 423
  const noise = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 2147483648 - 1 }
  // Original 108 BPM electronic bed with restrained kicks, plucks and transition sweeps.
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate, beat = 60 / 108, phase = t % beat
    const fade = Math.min(1, t / .6) * Math.min(1, (seconds - t) / 1.3)
    const kick = Math.sin(2 * Math.PI * (52 * phase + 1.2 * (1 - Math.exp(-phase * 35)))) * Math.exp(-phase * 27) * .16
    const step = Math.floor(t / (beat / 2)), pluckAge = t % (beat / 2)
    const notes = [220, 261.626, 329.628, 293.665, 220, 329.628, 391.995, 293.665]
    const pluck = Math.sin(2 * Math.PI * notes[step % notes.length] * pluckAge) * Math.exp(-pluckAge * 13) * .038
    const hat = noise() * Math.exp(-pluckAge * 130) * .023
    const pad = [130.813,164.814,220].reduce((sum,hz)=>sum+Math.sin(2*Math.PI*hz*t+.2*Math.sin(t*.3))*.009,0)
    samples[i] = (kick + pluck + hat + pad) * fade
  }
  for (const at of transitionTimes) {
    let filtered = 0
    for (let j = 0; j < rate * 1.1; j++) {
      const t = j / rate, index = Math.round((at - .55) * rate) + j
      filtered = filtered * .9 + noise() * .1
      const envelope = Math.pow(Math.sin(Math.PI * t / 1.1), 2)
      if (index >= 0 && index < samples.length) samples[index] += filtered * envelope * .28
    }
  }
  const peak = samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0)
  assert(peak > .05 && peak < 1)
  const wav = Buffer.alloc(44 + samples.length * 2)
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8)
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22)
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34)
  wav.write('data', 36); wav.writeUInt32LE(samples.length * 2, 40)
  for (let i = 0; i < samples.length; i++) wav.writeInt16LE(Math.round(samples[i] * 32767), 44 + i * 2)
  return { wav, peak }
}

const browser = await chromium.launch()
let encoder
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  // Serve a closed set of local assets from one browser origin for canvas export.
  await page.route('http://greener.local/**', async route => {
    const path = new URL(route.request().url()).pathname.slice(1)
    if (!(path === 'film.html' || /^assets\/(?:desktop|mobile)-(?:catalog|detail)-(?:light|dark)\.png$/.test(path) || path === 'assets/green-er-mark.png')) {
      await route.fulfill({ status: 404, body: '' }); return
    }
    await route.fulfill({ contentType: path.endsWith('.png') ? 'image/png' : 'text/html; charset=utf-8', body: await readFile(resolve(here, path)) })
  })
  await page.goto('http://greener.local/film.html?render')
  await page.evaluate(() => window.ready)
  for (const at of [3.85, 7.55, 11.25, 14.95, 18.65, 21.85]) {
    const state = await page.evaluate(t => window.draw(t), at)
    assert(state.transition && Math.abs(state.rotation + 45) < .001, 'Transition midpoint must expose two cube faces')
  }
  const transitionTimes = await page.evaluate(() => window.transitionTimes)
  assert.equal(transitionTimes.length, 6)
  assert(transitionTimes.every((t, i) => t >= 0 && t < seconds && (i === 0 || t > transitionTimes[i - 1])))
  const { wav, peak } = soundtrack(transitionTimes)
  await writeFile(resolve(out, 'soundtrack.wav'), wav)
  const storyboard = []
  for (const t of [2, 3.85, 5.7, 9, 11.25, 13, 16.4, 20, 24.4]) {
    await page.evaluate(t => window.draw(t), t)
    const png = await page.locator('#viewport').screenshot()
    const name = `frame-${String(t).replace('.', '-')}.png`
    await writeFile(resolve(out, name), png)
    storyboard.push({ time: t, file: name })
  }
  // A compact contact sheet makes all principal scenes reviewable together.
  await page.evaluate(async frames => {
    const sheet = document.createElement('canvas'); sheet.width = 1440; sheet.height = 900
    const c = sheet.getContext('2d'); c.fillStyle='#e9ede8';c.fillRect(0,0,1440,900)
    for (let i=0;i<frames.length;i++) {
      const image = new Image(); image.src = frames[i]; await image.decode()
      const x=(i%3)*480,y=Math.floor(i/3)*300;c.drawImage(image,x,y,480,270)
      c.fillStyle='#233a2e';c.font='16px Arial';c.fillText(['02 s','03.85 s','05.7 s','09 s','11.25 s','13 s','16.4 s','20 s','24.4 s'][i],x+12,y+291)
    }
    sheet.id='sheet';document.body.append(sheet)
  }, await Promise.all(storyboard.map(async frame => 'data:image/png;base64,' + (await readFile(resolve(out, frame.file))).toString('base64'))))
  await page.locator('#sheet').screenshot({ path: resolve(out, 'storyboard.png') })
  await page.locator('#sheet').evaluate(node => node.remove())
  encoder = spawn(ffmpeg, ['-y','-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-i',resolve(out,'soundtrack.wav'),'-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t',String(seconds),'-movflags','+faststart',resolve(out,'greener-responsive-v1.mp4')], { stdio: ['pipe','ignore','pipe'], windowsHide: true })
  let encoderError = ''
  encoder.stderr.on('data', chunk => { encoderError += chunk })
  encoder.stdin.on('error', () => {})
  const completed = new Promise((resolve, reject) => { encoder.on('error', reject);encoder.on('close', code => code === 0 ? resolve() : reject(new Error(encoderError || `FFmpeg exited: ${code}`))) })
  // Attach a handler immediately so a failed encoder cannot become unhandled.
  completed.catch(() => {})
  for (let frame = 0; frame < fps * seconds; frame++) {
    await page.evaluate(t => window.draw(t), frame / fps)
    const buffer = await page.screenshot({ type: 'jpeg', quality: 94 })
    assert(!encoder.stdin.destroyed, encoderError || 'Encoder stopped unexpectedly')
    if (!encoder.stdin.write(buffer)) await once(encoder.stdin, 'drain')
    if (frame % (fps * 5) === 0) console.log(`Rendered ${frame / fps}/${seconds}s`)
  }
  encoder.stdin.end();await completed
  assert.deepEqual(errors, [], 'Preview JavaScript must execute without errors')
  const info = await stat(resolve(out, 'greener-responsive-v1.mp4'))
  assert(info.size > 100000)
  await writeFile(resolve(out,'render-report.json'),JSON.stringify({ width:1920,height:1080,fps,seconds,frames:fps*seconds,audioPeak:peak,bytes:info.size,storyboard,errors },null,2))
  console.log(`Exported ${info.size} bytes; 780 frames; audio peak ${peak.toFixed(3)}.`)
} finally { if (encoder && encoder.exitCode === null) encoder.kill();await browser.close() }
