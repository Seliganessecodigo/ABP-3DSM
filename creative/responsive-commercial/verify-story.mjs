import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here=dirname(fileURLToPath(import.meta.url))
const require=createRequire(resolve(process.argv[2]??resolve(here,'../../frontend'),'package.json'))
const {chromium}=require('@playwright/test')
const browser=await chromium.launch()
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 const url=pathToFileURL(resolve(here,'story-v4.html')).href
 await page.goto(url+'?render');await page.evaluate(()=>window.ready)
 const captures=await page.evaluate(()=>window.storyGeometry)
 assert.equal(Object.keys(captures).length,7)
 for(const [key,capture] of Object.entries(captures)){
  assert.equal(capture.text,'app-pagamentos',key+' must preserve the selected application')
  for(const field of ['name','badge'])assert(Object.values(capture[field]).every(Number.isFinite))
 }
 const sequence=[
  [.5,'search',null],[2.4,'search',null],[4.15,'row-to-card','search-result'],[6.15,'mobile-result','details-click'],
  [7.6,'card-to-detail','details-click'],[9.3,'mobile-detail',null],[11.4,'detail-to-desktop','detail-scroll'],
  [13.3,'desktop-detail',null],[15.7,'both-devices','context-reveal'],[19,'brand',null],
 ]
 for(const [t,phase,trigger] of sequence){const actual=await page.evaluate(t=>window.draw(t),t);assert.equal(actual.phase,phase);assert.equal(actual.trigger,trigger)}
 for(const [t,text] of [[.5,''],[1,'pa'],[1.5,'paga'],[2.4,'pagamentos']])assert.equal((await page.evaluate(t=>window.draw(t),t)).searchText,text)
 for(const t of [2.8,5.5,6.4,8.8,10,12.8,14.2]){
  const before=await page.evaluate(t=>window.draw(t-.00001),t),after=await page.evaluate(t=>window.draw(t+.00001),t)
  assert(Math.hypot(before.anchorX-after.anchorX,before.anchorY-after.anchorY)<1,'Selected application anchor jumps at '+t)
 }
 for(let frame=0;frame<=600;frame++){
  const state=await page.evaluate(t=>window.draw(t),frame/30)
  assert.equal(state.applicationId,'svc-0142')
  assert(Number.isFinite(state.anchorX)&&Number.isFinite(state.anchorY))
  assert(state.anchorX>=0&&state.anchorX<=1920&&state.anchorY>=0&&state.anchorY<=1080,'Selected application leaves the frame')
 }
 await page.goto(url);await page.evaluate(()=>window.ready)
 await page.getByRole('button',{name:'Reproduzir',exact:true}).click();await page.waitForFunction(()=>Number(document.querySelector('#seek').value)>.15)
 await page.getByRole('button',{name:'Pausar',exact:true}).click();await page.getByRole('slider').fill('19');assert.match(await page.locator('#time').textContent(),/0:19/)
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.querySelector('#wrap').getBoundingClientRect().width<=391)
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=391));assert.deepEqual(errors,[])
 console.log('PASS: real application identity across 7 captures; search/click/scroll story; anchor continuity at 7 joins and all 601 sampled times; preview controls; no JS errors.')
}finally{await browser.close()}
