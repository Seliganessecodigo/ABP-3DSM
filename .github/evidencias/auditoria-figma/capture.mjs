import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { application, mixedCatalog, mockCatalog } from '../../../frontend/e2e/support/catalog.ts'
import { collectionResponse } from '../../../frontend/e2e/support/collection.ts'
const require = createRequire(new URL('../../../frontend/package.json', import.meta.url))
const { chromium } = require('@playwright/test')
const out = fileURLToPath(new URL('./', import.meta.url))
const browser = await chromium.launch()
const records = []
async function mockEnvironmentalData(page) {
  await mockCatalog(page, mixedCatalog)
  await page.route('**/applications/svc-0142/collections/latest', route => route.fulfill({ json: collectionResponse() }))
  await page.route(/\/analysis\/summary\?/, route => {
    const url = new URL(route.request().url())
    const energy = { value: 2, unit: 'kWh', reasons: [] }
    const emissions = { value: 340, unit: 'gCO2e', reasons: [] }
    return route.fulfill({ json: { status: 'available',
      period: { from: url.searchParams.get('from'), to: url.searchParams.get('to') },
      dataAsOf: '2026-10-17T20:00:00.000Z', totals: { energy, emissions },
      coverage: { energy: 1, emissions: 1 }, states: { AVAILABLE: 1, UNAVAILABLE: 0, NO_METRICS: 0, REMOVED: 0 },
      applications: [{ applicationId: application().id, name: application().name, state: 'AVAILABLE', energy, emissions, coverage: { energy: 1, emissions: 1 } }],
      provenance: { methodologies: [], factors: [], reasons: [] },
    } })
  })
  await page.route('**/applications/svc-0142/analysis**', route => {
    const url = new URL(route.request().url())
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const energy = { value: 2, unit: 'kWh', reasons: [] }
    const emissions = { value: 340, unit: 'gCO2e', reasons: [] }
    const common = { status: 'available', applicationId: application().id, period: { from, to }, coverage: { energy: 1, emissions: 1 } }
    return route.fulfill({ json: url.pathname.endsWith('/series')
      ? { ...common, granularity: 'day', totals: { energy, emissions }, events: [],
        points: Array.from({ length: 7 }, (_, i) => {
          const bucketStart = new Date(Date.parse(from) + (Date.parse(to) - Date.parse(from)) * i / 7).toISOString()
          const bucketEnd = new Date(Date.parse(from) + (Date.parse(to) - Date.parse(from)) * (i + 1) / 7).toISOString()
          return { id: `point-${i}`, bucketStart, bucketEnd, period: { from: bucketStart, to: bucketEnd },
            energy: { ...energy, value: i + 1 }, emissions: { ...emissions, value: 340 + i }, coverage: { energy: 1, emissions: 1 } }
        }) }
      : { ...common, energy, emissions, provenance: { methodologies: [], factors: [], reasons: [] } } })
  })
}


async function capture(page, name) {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({path: `${out}${name}.png`, fullPage: true, animations:'disabled'})
  const record = await page.evaluate(() => ({
    url: location.pathname + location.search,
    viewport: {width:innerWidth,height:innerHeight},
    mainText:document.querySelector('main')?.innerText,
    headings:[...document.querySelectorAll('main h1, main h2, main h3')].map(n=>n.textContent),
    horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
    scrollContainers:[...document.querySelectorAll('main,.workspace')].map(n=>({name:n.className,width:n.clientWidth,height:n.clientHeight,scrollHeight:n.scrollHeight})),
    disabledNavigation:[...document.querySelectorAll('nav button:disabled')].map(n=>n.getAttribute('aria-label')||n.textContent),
    languages:[...document.querySelectorAll('select option')].filter(n=>/^[a-z]{2}-[A-Z]{2}$/.test(n.value)).map(n=>({locale:n.value,name:n.textContent})),
  }))
  records.push({name,...record})
  await writeFile(`${out}capturas.json`,JSON.stringify(records,null,2))
  console.log(name)
}
const pages=[['catalogo','/'],['dashboard','/dashboard'],['detalhe','/services/svc-0142'],['metodologia','/services/svc-0142/methodology']]
for(const viewport of [{width:1366,height:850},{width:1920,height:1080},{width:390,height:844}]) {
  const context=await browser.newContext({viewport,locale:'pt-BR',timezoneId:'America/Sao_Paulo',colorScheme:'light',reducedMotion:'reduce'})
  const page=await context.newPage()
  await mockEnvironmentalData(page)
  for(const [name,path] of pages) {
    await page.goto(`http://127.0.0.1:4173${path}`)
    await page.locator('main h1').waitFor()
    if(name==='dashboard') await page.getByRole('region',{name:'Indicadores ambientais'}).waitFor()
    if(name==='detalhe') await page.getByRole('figure').first().waitFor()
    if(name==='metodologia') await page.locator('main pre code').waitFor()
    if(name==='catalogo') await page.locator('[data-application-id]:visible').first().waitFor()
    await capture(page,`${name}-${viewport.width}-claro`)
  }
  await page.goto('http://127.0.0.1:4173/methodology')
  await page.locator('#methodology-application').waitFor()
  await capture(page,`metodologia-selecao-${viewport.width}`)
  if(viewport.width===1366) {
    await page.goto('http://127.0.0.1:4173/services/svc-0142')
    await page.getByRole('figure').first().waitFor()
    await page.getByRole('button',{name:'Tabela',exact:true}).click()
    await capture(page,'detalhe-tabela')
    await page.locator('#analysis-details summary').click()
    await capture(page,'detalhe-contexto')
    await page.goto('http://127.0.0.1:4173/')
    await page.getByRole('button',{name:'Filtros por coluna',exact:true}).click()
    await capture(page,'catalogo-filtros')
  }
  if(viewport.width===1920) {
    await page.getByRole('switch',{name:'Modo escuro',exact:true}).click()
    for(const [name,path] of pages) {
      await page.goto(`http://127.0.0.1:4173${path}`)
      if(name==='dashboard') await page.getByRole('region',{name:'Indicadores ambientais'}).waitFor()
      if(name==='detalhe') await page.getByRole('figure').first().waitFor()
      if(name==='metodologia') await page.locator('main pre code').waitFor()
      await capture(page,`${name}-1920-escuro`)
    }
  }
  if(viewport.width===390) {
    await page.locator('.mobile-menu-toggle').click()
    await capture(page,'menu-mobile')
  }
  await context.close()
}
for(const [name,path] of pages) {
  const context=await browser.newContext({viewport:{width:1366,height:850},locale:'pt-BR',colorScheme:'light',reducedMotion:'reduce'})
  const page=await context.newPage()
  await mockEnvironmentalData(page)
  let release
  const gate=new Promise(r=>{release=r})
  await page.route(url=>/^\/(api\/)?(applications|analysis)(\/|$)/.test(url.pathname),async route=>{
    await gate
    await route.fallback()
  })
  await page.goto(`http://127.0.0.1:4173${path}`)
  await page.locator('[data-loading-state]').first().waitFor()
  await capture(page,`${name}-loading`)
  release()
  await context.close()
}
const page=await browser.newPage({viewport:{width:1440,height:1000}})
try {
  const response=await page.goto('https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=8-2',{waitUntil:'domcontentloaded',timeout:45000})
  await page.waitForTimeout(4000)
  await page.screenshot({path:`${out}figma-browser.png`})
  await writeFile(`${out}figma-browser.json`,JSON.stringify({status:response?.status(),title:await page.title(),text:(await page.locator('body').innerText()).slice(0,6000)},null,2))
} catch(error) {
  await writeFile(`${out}figma-browser.json`,JSON.stringify({error:String(error)},null,2))
}
await writeFile(`${out}capturas.json`,JSON.stringify(records,null,2))
await browser.close()
