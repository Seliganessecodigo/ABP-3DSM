import type { Page } from '@playwright/test'

export function alertsFixture(input?: Record<string, { threshold?: number; thresholdPercent?: number; alertsEnabled?: boolean; period?: { kind: string; from?: string; to?: string } } | null>) {
  const period = { kind: 'custom', from: '2026-10-01T00:00:00.000Z', to: '2026-10-02T00:00:00.000Z' }
  const enabled = (tab: string) => input === undefined || input?.[tab]?.alertsEnabled === true
  const evaluation = (tab: string, metric: string, value: number, unit: string, threshold: number) => ({ metric, status: 'exceeded', value, unit, threshold, coveragePercent: 79,
    period: input?.[tab]?.period ?? period,
    from: input?.[tab]?.period?.from ?? period.from, to: input?.[tab]?.period?.to ?? period.to })
  return { configured: !!(enabled('energy') || enabled('emissions') || enabled('coverage')), evaluatedAt: '2026-11-10T12:00:00.000Z', applications: [{ applicationId: 'svc-0142', name: 'app-pagamentos', evaluations: [
    ...(enabled('energy') ? [evaluation('energy','energy',9.4,'kWh',input?.energy?.threshold ?? 8)] : []),
    ...(enabled('emissions') ? [evaluation('emissions','emissions',1.8,'kgCO2e',input?.emissions?.threshold ?? 1.5)] : []),
    ...(enabled('coverage') ? [evaluation('coverage','energyCoverage',79,'%',input?.coverage?.thresholdPercent ?? 85)] : []),
  ] }] }
}
export async function mockPreferenceEffects(page: Page) {
  await page.route('**/api/me/preferences/alerts', route => route.fulfill({ json: { configured: false, evaluatedAt: '2026-11-10T12:00:00.000Z', applications: [] } }))
  await page.route('**/api/me/preferences/alerts/preview', route => route.fulfill({ json: alertsFixture(route.request().postDataJSON()) }))
  await page.route('**/analysis/summary?*', route => {
    const params=new URL(route.request().url()).searchParams
    const from=params.get('from')!,to=params.get('to')!
    const end=new Date(Math.min(Date.parse(from)+3600000,Date.parse(to))).toISOString()
    const energy={value:2,unit:'kWh',reasons:[]},emissions={value:85,unit:'gCO2e',reasons:[]},coverage={energy:1,emissions:1}
    return route.fulfill({json:{ status:'available',period:{from,to},dataAsOf:to,totals:{energy,emissions},coverage,
      states:{AVAILABLE:1,UNAVAILABLE:0,NO_METRICS:0,REMOVED:0},applications:[{applicationId:'svc-0142',name:'app-pagamentos',state:'AVAILABLE',energy,emissions,coverage}],
      provenance:{methodologies:[],factors:[],reasons:[]},series:{granularity:params.get('granularity'),points:[{bucketStart:from,bucketEnd:end,period:{from,to:end},energy,emissions,coverage}]}}})
  })
}
