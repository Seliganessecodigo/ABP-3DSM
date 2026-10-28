import { BadRequestException, ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { PreferencesRepository } from './preferences.repository'
import { preferenceTabs, type PreferenceTab, type PreferenceValue, type PreferencesDto, type SavedPreferenceDto } from './preferences.dto'
import type { AuthPrincipal } from '../authentication/authentication.service'

function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function number(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= 0 }
function exact(value: Record<string, unknown>, keys: string[]) { return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)) }

export function validatePreference(tab: string, input: unknown): { tab: PreferenceTab; value: PreferenceValue; expectedRevision: number } {
  const invalid = () => new BadRequestException({ code: 'INVALID_PREFERENCE', message: 'Preferência inválida' })
  const selectedTab = preferenceTabs.find((item) => item === tab)
  if (!selectedTab || !record(input) || !exact(input, ['expectedRevision', 'value']) || !Number.isSafeInteger(input.expectedRevision) || !number(input.expectedRevision) || !record(input.value)) throw invalid()
  const value = input.value
  if (selectedTab === 'energy' || selectedTab === 'emissions') {
    if (!exact(value, ['threshold', 'alertsEnabled', 'scope', 'referencePeriod', 'unit']) || !number(value.threshold) || typeof value.alertsEnabled !== 'boolean' || value.scope !== 'application' || value.referencePeriod !== 'month' || value.unit !== (selectedTab === 'energy' ? 'kWh' : 'kgCO2e')) throw invalid()
    return { tab: selectedTab, expectedRevision: input.expectedRevision, value: { threshold: value.threshold, alertsEnabled: value.alertsEnabled, scope: 'application', referencePeriod: 'month', unit: selectedTab === 'energy' ? 'kWh' : 'kgCO2e' } }
  }
  if (selectedTab === 'coverage') {
    if (!exact(value, ['thresholdPercent', 'alertsEnabled']) || !number(value.thresholdPercent) || value.thresholdPercent > 100 || typeof value.alertsEnabled !== 'boolean') throw invalid()
    return { tab: selectedTab, expectedRevision: input.expectedRevision, value: { thresholdPercent: value.thresholdPercent, alertsEnabled: value.alertsEnabled } }
  }
  if (!exact(value, ['periodDays', 'granularity']) || value.periodDays !== 7 && value.periodDays !== 30 || value.granularity !== 'hour' && value.granularity !== 'day') throw invalid()
  return { tab: selectedTab, expectedRevision: input.expectedRevision, value: { periodDays: value.periodDays, granularity: value.granularity } }
}
function present(row: { value: PreferenceValue; revision: number; updatedAt: Date }): SavedPreferenceDto {
  return { value: row.value, revision: row.revision, updatedAt: row.updatedAt.toISOString() }
}
function unavailable() { return new ServiceUnavailableException({ code: 'PREFERENCES_UNAVAILABLE', message: 'Preferências indisponíveis' }) }

@Injectable()
export class PreferencesService {
  constructor(private readonly repository: PreferencesRepository) {}
  async find(principal: AuthPrincipal): Promise<PreferencesDto> {
    try {
      const rows = await this.repository.find(principal.userId)
      const result: PreferencesDto = { energy: null, emissions: null, coverage: null, analysis: null }
      for (const row of rows) result[row.tab] = present(row)
      return result
    } catch { throw unavailable() }
  }
  async save(principal: AuthPrincipal, tab: string, input: unknown): Promise<SavedPreferenceDto> {
    const parsed = validatePreference(tab, input)
    let row
    try { row = await this.repository.save(principal, parsed.tab, parsed.value, parsed.expectedRevision) } catch { throw unavailable() }
    if (!row) throw new ConflictException({ code: 'PREFERENCE_CONFLICT', message: 'A preferência foi alterada em outra sessão; consulte a revisão atual' })
    return present(row)
  }
}
