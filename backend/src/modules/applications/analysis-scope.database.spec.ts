import { ApplicationEntity } from '../../database/entities/application.entity'
import { createQualityFixture, type QualityFixture } from '../../../test/quality-fixture'
import { ApplicationsRepository } from './applications.repository'
import { EnvironmentalAnalysisSummaryService } from './environmental-analysis-summary.service'

const describeDatabase = process.env.TEST_DATABASE_URL ? describe : describe.skip

describeDatabase('analysis scope query shape against PostgreSQL', () => {
  let fixture: QualityFixture
  const queries: { sql: string; parameters: number }[] = []
  beforeAll(async () => {
    fixture = await createQualityFixture()
    await fixture.database.getRepository(ApplicationEntity).save([
      { id: 'scoped-app', name: 'Scoped application' }, { id: 'unrelated-app', name: 'Unrelated application' },
    ])
    jest.spyOn(fixture.database.logger, 'logQuery').mockImplementation((sql, parameters) => { queries.push({ sql, parameters: parameters?.length ?? 0 }) })
  }, 60_000)
  beforeEach(() => { queries.length = 0 })
  afterAll(async () => { jest.restoreAllMocks(); await fixture?.close() }, 60_000)

  it('binds a large ID scope as one array rather than exceeding the SQL parameter limit', async () => {
    const repository = fixture.app.get(ApplicationsRepository)
    expect(await repository.findByIds([])).toEqual([])
    expect(queries).toHaveLength(0)
    const ids = ['scoped-app', ...Array.from({ length: 70_000 }, (_, index) => `not-present-${index}`)]
    const rows = await repository.findByIds(ids)
    expect(rows.map(row => row.id)).toEqual(['scoped-app'])
    expect(queries).toHaveLength(1)
    expect(queries[0].parameters).toBe(1)
  })

  it('restricts the application read before loading observations and preserves absent values', async () => {
    const result = await fixture.app.get(EnvironmentalAnalysisSummaryService).getSummary({
      from: '2026-10-01T00:00:00Z', to: '2026-10-02T00:00:00Z', applicationIds: ['scoped-app'], includeProvenance: 'false',
    }, { includeMissingApplications: true })
    expect(result.applications.map(app => app.applicationId)).toEqual(['scoped-app'])
    expect(result.totals.energy.value).toBeNull()
    expect(result.totals.emissions.value).toBeNull()
    const catalogReads = queries.filter(query => /FROM "applications"/.test(query.sql))
    expect(catalogReads).toHaveLength(1)
    expect(catalogReads[0].parameters).toBe(1)
  })
})
