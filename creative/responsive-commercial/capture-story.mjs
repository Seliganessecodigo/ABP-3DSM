import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'

const here = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(process.argv[2] ?? resolve(here, '../../frontend'))
const require = createRequire(resolve(appRoot, 'package.json'))
const { chromium } = require('@playwright/test')
const browser = await chromium.launch()
const now = '2026-11-03T15:00:00.000Z'
const applications = ['app-pagamentos', 'app-checkout', 'app-estoque', 'app-relatorios'].map((name, i) => ({
  id: ['svc-0142', 'svc-0121', 'svc-0487', 'svc-0900'][i], name,
  state: 'AVAILABLE', reason: 'METRICS_VALID',
  location: { regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: 'São Paulo', latitude: -23.55, longitude: -46.63 },
  lastObservationAt: now, isStale: false, isCalculable: true, firstSeenAt: now,
  lastCheckedAt: now, removedAt: null, updatedAt: now,
}))
// Same contract and operational metric examples used in application-detail.spec.ts.
const evidence = { id: 'collection-demo', applicationId: 'svc-0142', intervalStart: '2026-11-03T14:30:00.000Z', intervalEnd: now, collectedAt: now,
  collectionIntervalSeconds: 1800, isStale: false, state: 'AVAILABLE', reason: 'METRICS_VALID', lastCheckedAt: now,
  metrics: { cpu: { value: 38, unit: '%', status: 'available' }, memory: { value: null, unit: null, status: 'missing' },
    disk: { value: 0, unit: 'GB/s', status: 'available' }, network: { value: 1.2, unit: 'Mbps', status: 'available' } },
}

const metadata = {}
const url = process.argv[3] ?? 'http://127.0.0.1:4189'
async function box(locator, origin = {x:0,y:0}) {
 const value = await locator.boundingBox();assert(value)
 return { x:value.x-origin.x,y:value.y-origin.y,w:value.width,h:value.height }
}
async function snapshot(page, key, mobile, detail) {
 await page.evaluate(()=>document.fonts.ready)
 const name=detail?page.getByRole('heading',{name:'app-pagamentos',exact:true}):page.getByText('app-pagamentos',{exact:true}).filter({visible:true}).first()
 await name.waitFor()
 const subject=detail?page.getByRole('main'):mobile?page.locator('article').filter({has:name}).first():page.getByRole('row').filter({has:name})
 const rect=await box(subject)
 const badge=subject.locator('.state-badge').filter({visible:true}).first()
 const nameBox=await name.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})
 const badgeBox=await box(badge)
 const font=await name.evaluate(el=>({font:getComputedStyle(el).font,color:getComputedStyle(el).color,text:el.textContent}))
 const action=detail?null:await box(subject.getByRole('link',{name:/ver detalhes/i}))
 const search=detail?null:await box(page.getByRole('searchbox'))
 const backdrop=locator=>locator.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement){const c=getComputedStyle(p).backgroundColor;if(c!=='rgba(0, 0, 0, 0)'&&c!=='transparent')return c}return '#fff'})
 metadata[key]={width:mobile?390:1440,height:mobile?844:900,dpr:mobile?2:1,subject:rect,name:nameBox,badge:badgeBox,nameBackground:await backdrop(name),badgeBackground:await backdrop(badge),action,search,...font}
 assert.equal(await page.getByRole('alert').count(),0)
 await page.screenshot({path:resolve(here,'assets/'+key+'.png'),fullPage:true})
 console.log('Captured '+key)
}
try {
 for (const mobile of [false,true]) {
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:mobile?2:1,locale:'pt-BR',colorScheme:'light'})
  await page.clock.setFixedTime(new Date(now));await page.addInitScript(()=>localStorage.setItem('greener-theme','light'))
  await page.route(/\/api\/applications(?:\/[^/?]+)?(?:\/collections\/[^/?]+)?(?:\?.*)?$/,async route=>{const path=new URL(route.request().url()).pathname;await route.fulfill({json:path.includes('/collections/')?evidence:path.endsWith('/applications')?applications:applications[0]})})
  await page.goto(url+'/');await page.getByText('app-pagamentos',{exact:true}).filter({visible:true}).first().waitFor()
  if(!mobile){await snapshot(page,'story-desktop-base',false,false)
   for(const [i,value] of ['pa','paga','pagamentos'].entries()) {await page.getByRole('searchbox').fill(value);await snapshot(page,'story-search-'+i,false,false)}
  }else{await page.getByRole('searchbox').fill('pagamentos');await snapshot(page,'story-mobile-result',true,false)}
  const link=(mobile?page.locator('article'):page.getByRole('row')).filter({has:page.getByText('app-pagamentos',{exact:true})}).filter({visible:true}).getByRole('link',{name:/ver detalhes/i})
  await link.click();await page.getByRole('heading',{name:'app-pagamentos',exact:true}).waitFor()
  assert(new URL(page.url()).pathname.endsWith('/services/svc-0142'))
  await snapshot(page,mobile?'story-mobile-detail':'story-desktop-detail',mobile,true)
  if(mobile)assert(await page.evaluate(()=>document.documentElement.scrollWidth<=390))
  await page.close()
 }
 await writeFile(resolve(here,'assets/story-geometry.js'),'window.storyGeometry = '+JSON.stringify(metadata,null,2)+';\n')
}finally{await browser.close()}
