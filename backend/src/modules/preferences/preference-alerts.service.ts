import { BadRequestException, Injectable } from '@nestjs/common'
import { EnvironmentalAnalysisSummaryService } from '../applications/environmental-analysis-summary.service'
import type { EnvironmentalAnalysisSummaryDto, EnvironmentalAnalysisSummaryApplicationDto } from '../applications/environmental-analysis-summary.dto'
import type { AuthPrincipal } from '../authentication/authentication.service'
import { PreferencesService, validatePreference } from './preferences.service'
import type { CoveragePreferenceDto, LimitPreferenceDto } from './preferences.dto'
import { preferencePeriodRange, type PreferencePeriodDto } from './preference-period'
import type { PreferenceAlertDto, PreferenceAlertsDto, PreferenceAlertsInputDto } from './preference-alerts.dto'

type Assessment = { metric: PreferenceAlertDto['metric']; threshold: number; period: PreferencePeriodDto }
function validateInput(input: unknown): PreferenceAlertsInputDto {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 3) throw new BadRequestException({ code: 'INVALID_PREFERENCE' })
  const data = input as Record<string, unknown>
  const result: PreferenceAlertsInputDto = { energy: null, emissions: null, coverage: null }
  for (const tab of ['energy', 'emissions', 'coverage'] as const) {
    if (data[tab] === null) continue
    const value = validatePreference(tab, { expectedRevision: 0, value: data[tab] }).value
    if (tab === 'coverage') result.coverage = value as CoveragePreferenceDto
    else result[tab] = value as LimitPreferenceDto
  }
  return result
}
function assessments(input: PreferenceAlertsInputDto): Assessment[] {
  const result: Assessment[] = []
  for (const tab of ['energy', 'emissions'] as const) {
    const value = input[tab]
    if (value?.alertsEnabled) result.push({ metric: tab, threshold: value.threshold, period: value.period ?? { kind: 'month' } })
  }
  if (input.coverage?.alertsEnabled) {
    for (const metric of ['energyCoverage', 'emissionsCoverage'] as const) result.push({ metric, threshold: input.coverage.thresholdPercent, period: input.coverage.period ?? { kind: 'month' } })
  }
  return result
}
function evaluate(assessment: Assessment, application: EnvironmentalAnalysisSummaryApplicationDto, range: { from: string; to: string }): PreferenceAlertDto {
  const coverageMetric = assessment.metric === 'energy' || assessment.metric === 'energyCoverage' ? 'energy' : 'emissions'
  const coveragePercent = application.coverage[coverageMetric] * 100
  const coverageOnly = assessment.metric === 'energyCoverage' || assessment.metric === 'emissionsCoverage'
  const reading = application[coverageMetric]
  const value = coverageOnly ? coveragePercent : reading.value === null ? null : reading.value / (assessment.metric === 'emissions' ? 1000 : 1)
  const exceeded = value !== null && (coverageOnly ? value < assessment.threshold : value > assessment.threshold)
  const status = exceeded ? 'exceeded' : value === null || !coverageOnly && coveragePercent < 100 ? 'insufficient-data' : 'within'
  return { ...assessment, ...range, status, value, unit: coverageOnly ? '%' : assessment.metric === 'energy' ? 'kWh' : 'kgCO2e', coveragePercent }
}
@Injectable()
export class PreferenceAlertsService {
  constructor(private readonly preferences: PreferencesService, private readonly summary: EnvironmentalAnalysisSummaryService) {}
  async find(principal: AuthPrincipal): Promise<PreferenceAlertsDto> {
    const saved = await this.preferences.find(principal)
    return this.evaluate({ energy: saved.energy?.value ?? null, emissions: saved.emissions?.value ?? null, coverage: saved.coverage?.value ?? null })
  }
  async evaluate(input: unknown): Promise<PreferenceAlertsDto> {
    const selected = assessments(validateInput(input))
    const now = new Date()
    const ranges = selected.map(item => preferencePeriodRange(item.period, now))
    const results = new Map<string, EnvironmentalAnalysisSummaryDto>()
    const distinct = new Map(ranges.map(range => [JSON.stringify(range), range]))
    await Promise.all([...distinct].filter(([, range]) => range.from !== range.to).map(async ([key, range]) => {
      results.set(key, await this.summary.getSummary({ ...range, includeProvenance: 'false' }, { includeMissingApplications: true }))
    }))
    const applications = new Map<string, PreferenceAlertsDto['applications'][number]>()
    for (const [index, assessment] of selected.entries()) {
      const range = ranges[index]
      const summary = results.get(JSON.stringify(range))
      for (const application of summary?.applications ?? []) {
        const entry = applications.get(application.applicationId) ?? { applicationId: application.applicationId, name: application.name, evaluations: [] }
        entry.evaluations.push(evaluate(assessment, application, range))
        applications.set(application.applicationId, entry)
      }
    }
    return { configured: selected.length > 0, evaluatedAt: now.toISOString(), applications: [...applications.values()] }
  }
}
