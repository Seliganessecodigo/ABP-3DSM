import 'reflect-metadata'
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { Client } from 'pg'
import { DataSource } from 'typeorm'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { AddressInfo } from 'node:net'
import * as process from 'node:process'
import { AppModule } from '../src/app.module'
import { typeOrmOptions } from '../src/database/typeorm.options'
import { EMAIL_DELIVERY } from '../src/modules/authentication/email-delivery'
import { MonitoringScheduler } from '../src/modules/applications/monitoring-scheduler'
import { MonitoringCycleRunner } from '../src/modules/applications/monitoring-cycle.runner'
import { InitialSchema1791240000000 } from '../src/database/migrations/1791240000000-InitialSchema'
import { CompleteMonitoringPersistence1791250000000 } from '../src/database/migrations/1791250000000-CompleteMonitoringPersistence'
import { AddApplicationLocation1791260000000 } from '../src/database/migrations/1791260000000-AddApplicationLocation'
import { CarbonFactorSnapshots1791340000000 } from '../src/database/migrations/1791340000000-CarbonFactorSnapshots'
import { DiscoverApplications1791350000000 } from '../src/database/migrations/1791350000000-DiscoverApplications'
import { ApplicationOperationalStatus1791360000000 } from '../src/database/migrations/1791360000000-ApplicationOperationalStatus'
import { MonitoringIncidents1791370000000 } from '../src/database/migrations/1791370000000-MonitoringIncidents'
import { CollectionCalculationEvidence1791380000000 } from '../src/database/migrations/1791380000000-CollectionCalculationEvidence'
import { AuthenticationAndOrganizations1791400000000 } from '../src/database/migrations/1791400000000-AuthenticationAndOrganizations'
import { AdminTotpAuthentication1791410000000 } from '../src/database/migrations/1791410000000-AdminTotpAuthentication'
import { SsoAuthentication1791420000000 } from '../src/database/migrations/1791420000000-SsoAuthentication'
import { UserPreferences1793200000000 } from '../src/database/migrations/1793200000000-UserPreferences'
import { AuditActorIdentity1793300000000 } from '../src/database/migrations/1793300000000-AuditActorIdentity'
import { UserAccountStatus1793400000000 } from '../src/database/migrations/1793400000000-UserAccountStatus'
import { PasswordRecovery1793500000000 } from '../src/database/migrations/1793500000000-PasswordRecovery'

/** Real application/adapters/migrations; only the external HTTP sources and email are local fixtures. */
export async function createQualityFixture(port = 0, collectBeforeListening = false) {
  if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is required')
  const admin = new Client({ connectionString: process.env.TEST_DATABASE_URL })
  const name = `quality_129_${randomUUID().replaceAll('-', '')}`
  const databaseUrl = new URL(process.env.TEST_DATABASE_URL)
  databaseUrl.pathname = `/${name}`
  const previous = new Map<string, string | undefined>()
  const sources = { invalidSnapshot: false, failedMetrics: new Set<string>(), carbonUnavailable: false }
  const requests: string[] = []
  const emails: Array<{ to: string; subject: string; text: string }> = []
  const location = { region_code: 'br-sudeste', country: 'Brazil', region: 'Sudeste', city: null,
    latitude: -23.5505, longitude: -46.6333 }
  const upstream = createServer((request, response) => {
    const path = request.url ?? ''
    requests.push(path)
    let body: unknown
    let status = 200
    if (path === '/services') {
      body = sources.invalidSnapshot ? [{ id: 'invalid' }] : ['api', 'worker'].map((id) => ({
        id: `quality-${id}`, name: `Quality ${id}`, location, metrics_path: `/metrics/quality-${id}`,
      }))
    } else if (path.startsWith('/metrics/')) {
      status = sources.failedMetrics.has(path.split('/').at(-1) ?? '') ? 503 : 200
      body = { collection_interval_seconds: 60, metrics: {
        cpu_percent: 50, memory_gb: 2, disk_gb: 10, network_gb: 1,
      } }
    } else if (path === '/regions/br-sudeste/carbon-intensity') {
      status = sources.carbonUnavailable ? 503 : 200
      body = { ...location, carbon_intensity_gco2e_per_kwh: 85, renewable_share_percent: 83 }
    } else {
      status = 404
      body = { error: 'Unknown fixture route' }
    }
    response.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body))
  })
  let app: INestApplication | undefined
  let database: DataSource | undefined
  let created = false
  async function close() {
    try {
      if (app) await app.close()
      if (database?.isInitialized) await database.destroy()
      if (upstream.listening) await new Promise<void>((resolve, reject) =>
        upstream.close((error) => error ? reject(error) : resolve()))
      if (created && /^quality_129_[a-f0-9]{32}$/.test(name)) await admin.query(`DROP DATABASE "${name}"`)
    } finally {
      await admin.end()
      for (const [key, value] of previous) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    }
  }
  try {
    await admin.connect()
    await admin.query(`CREATE DATABASE "${name}"`)
    created = true
    await new Promise<void>((resolve) => upstream.listen(0, '127.0.0.1', resolve))
    const sourceUrl = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`
    for (const [key, value] of Object.entries({
      DATABASE_URL: databaseUrl.toString(), METRICS_AGGREGATOR_URL: sourceUrl,
      CARBON_INTENSITY_URL: sourceUrl, AUTH_JWT_SECRET: 'quality-test-only-secret-with-at-least-32-bytes',
      APP_BASE_URL: 'http://127.0.0.1:4300',
    })) {
      previous.set(key, process.env[key])
      process.env[key] = value
    }
    database = new DataSource({ type: 'postgres', url: databaseUrl.toString(),
      entities: typeOrmOptions().entities, synchronize: false,
      migrations: [InitialSchema1791240000000, CompleteMonitoringPersistence1791250000000,
        AddApplicationLocation1791260000000, CarbonFactorSnapshots1791340000000,
        DiscoverApplications1791350000000, ApplicationOperationalStatus1791360000000,
        MonitoringIncidents1791370000000, CollectionCalculationEvidence1791380000000,
        AuthenticationAndOrganizations1791400000000, AdminTotpAuthentication1791410000000,
        SsoAuthentication1791420000000, UserPreferences1793200000000,
        AuditActorIdentity1793300000000, UserAccountStatus1793400000000,
        PasswordRecovery1793500000000],
    })
    await database.initialize()
    await database.runMigrations()
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DataSource).useValue(database)
      .overrideProvider(MonitoringScheduler).useValue({})
      .overrideProvider(EMAIL_DELIVERY).useValue({
        send: async (to: string, subject: string, text: string) => { emails.push({ to, subject, text }) },
      }).compile()
    app = module.createNestApplication({ logger: false })
    app.enableCors({ origin: 'http://127.0.0.1:4300' })
    await app.init()
    if (collectBeforeListening) await app.get(MonitoringCycleRunner).run()
    await app.listen(port, '127.0.0.1')
    return { app, database, url: await app.getUrl(), sources, requests, emails,
      cycle: () => app!.get(MonitoringCycleRunner).run(), close }
  } catch (error) {
    await close()
    throw error
  }
}

export type QualityFixture = Awaited<ReturnType<typeof createQualityFixture>>
