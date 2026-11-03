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
const fps = 30, seconds = 30, rate = 48000
await mkdir(out, { recursive: true })

function soundtrack(stepTimes) {
  const samples = new Float64Array(rate * seconds)
  let seed = 2603
  const noise = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 2147483648 - 1 }
  for (const [index, at] of stepTimes.entries()) {
    const start = Math.round(at * rate)
    let filtered = 0
    for (let i = 0; i < rate * .42; i++) {
      const t = i / rate
      filtered = filtered * .80 + noise() * .20
      const strike = filtered * Math.exp(-t * 85) * .55
      const body = Math.sin(2 * Math.PI * (94 + 10 * (index % 2)) * t) * Math.exp(-t * 30) * .23
      const grit = filtered * Math.exp(-t * 20) * .13
      const value = (strike + body + grit) * Math.min(1, i / 80)
      if (start + i < samples.length) samples[start + i] += value
      if (start + i + 2800 < samples.length) samples[start + i + 2800] += value * .12
    }
  }
  // Original synthesized score: a restrained D minor bed resolves to F major.
  for (let i = Math.floor(8.5 * rate); i < samples.length; i++) {
    const t = i / rate
    const envelope = Math.min(1, (t - 8.5) / 4) * Math.min(1, (30 - t) / 2.2)
    const notes = t < 25.3 ? [146.832, 220, 261.626, 329.628] : [174.614, 220, 261.626, 349.228]
    let value = 0
    for (const [n, hz] of notes.entries()) {
      value += Math.sin(2 * Math.PI * hz * t + .35 * Math.sin(t * .4 + n)) * .012
      value += Math.sin(2 * Math.PI * hz * 1.002 * t) * .006
    }
    samples[i] += value * envelope
    const chimeAge = t - 25.35
    if (chimeAge >= 0) samples[i] += Math.sin(2 * Math.PI * 698.456 * chimeAge) * Math.exp(-chimeAge * 1.8) * .045 * Math.min(1, chimeAge * 50)
  }
  const peak = samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0)
  assert(peak > .05 && peak < 1, `Unexpected audio peak: ${peak}`)
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
    if (!['film.html', 'assets/catalog.png', 'assets/green-er-mark.png'].includes(path)) {
      await route.fulfill({ status: 404, body: '' }); return
    }
    await route.fulfill({ contentType: path.endsWith('.png') ? 'image/png' : 'text/html; charset=utf-8', body: await readFile(resolve(here, path)) })
  })
  await page.goto('http://greener.local/film.html')
  await page.evaluate(() => window.ready)
  const stepTimes = await page.evaluate(() => window.stepTimes)
  assert.equal(stepTimes.length, 22)
  assert(stepTimes.every((t, i) => t >= 0 && t < seconds && (i === 0 || t > stepTimes[i - 1])))
  const { wav, peak } = soundtrack(stepTimes)
  await writeFile(resolve(out, 'soundtrack.wav'), wav)
  const storyboard = []
  for (const t of [2.5, 7, 13, 19, 24.8, 28.5]) {
    await page.evaluate(t => window.draw(t), t)
    const png = await page.locator('canvas').screenshot()
    const name = `frame-${String(t).replace('.', '-')}.png`
    await writeFile(resolve(out, name), png)
    storyboard.push({ time: t, file: name })
  }
  // A compact contact sheet makes all principal scenes reviewable together.
  await page.evaluate(async frames => {
    const sheet = document.createElement('canvas'); sheet.width = 1440; sheet.height = 600
    const c = sheet.getContext('2d'); c.fillStyle='#e9ede8';c.fillRect(0,0,1440,600)
    for (let i=0;i<frames.length;i++) {
      const image = new Image(); image.src = frames[i]; await image.decode()
      const x=(i%3)*480,y=Math.floor(i/3)*300;c.drawImage(image,x,y,480,270)
      c.fillStyle='#233a2e';c.font='16px Arial';c.fillText(['02.5 s','07 s','13 s','19 s','24.8 s','28.5 s'][i],x+12,y+291)
    }
    sheet.id='sheet';document.body.append(sheet)
  }, await Promise.all(storyboard.map(async frame => 'data:image/png;base64,' + (await readFile(resolve(out, frame.file))).toString('base64'))))
  await page.locator('#sheet').screenshot({ path: resolve(out, 'storyboard.png') })
  await page.locator('#sheet').evaluate(node => node.remove())
  encoder = spawn(ffmpeg, ['-y','-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-i',resolve(out,'soundtrack.wav'),'-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t',String(seconds),'-movflags','+faststart',resolve(out,'greener-commercial-v1.mp4')], { stdio: ['pipe','ignore','pipe'], windowsHide: true })
  let encoderError = ''
  encoder.stderr.on('data', chunk => { encoderError += chunk })
  encoder.stdin.on('error', () => {})
  const completed = new Promise((resolve, reject) => { encoder.on('error', reject);encoder.on('close', code => code === 0 ? resolve() : reject(new Error(encoderError || `FFmpeg exited: ${code}`))) })
  // Attach a handler immediately so a failed encoder cannot become unhandled.
  completed.catch(() => {})
  for (let frame = 0; frame < fps * seconds; frame++) {
    const base64 = await page.evaluate(t => { window.draw(t);return document.querySelector('canvas').toDataURL('image/jpeg',.95).split(',')[1] }, frame / fps)
    assert(!encoder.stdin.destroyed, encoderError || 'Encoder stopped unexpectedly')
    if (!encoder.stdin.write(Buffer.from(base64, 'base64'))) await once(encoder.stdin, 'drain')
    if (frame % (fps * 5) === 0) console.log(`Rendered ${frame / fps}/${seconds}s`)
  }
  encoder.stdin.end();await completed
  assert.deepEqual(errors, [], 'Preview JavaScript must execute without errors')
  const info = await stat(resolve(out, 'greener-commercial-v1.mp4'))
  assert(info.size > 100000)
  await writeFile(resolve(out,'render-report.json'),JSON.stringify({ width:1920,height:1080,fps,seconds,frames:fps*seconds,audioPeak:peak,bytes:info.size,storyboard,errors },null,2))
  console.log(`Exported ${info.size} bytes; 900 frames; audio peak ${peak.toFixed(3)}.`)
} finally { if (encoder && encoder.exitCode === null) encoder.kill();await browser.close() }
