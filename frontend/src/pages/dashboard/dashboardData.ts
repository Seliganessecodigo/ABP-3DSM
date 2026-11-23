import type { Application } from '../../features/applications/api.ts'
import type { EnvironmentalSummaryApplication } from '../../features/analysis/environmentalSummary.ts'
import type { DashboardQuery, DashboardTableFilters } from './query.ts'

export type DashboardRow = EnvironmentalSummaryApplication & Readonly<{ regionCode: string | null }>

export function normalizeDashboardSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
}

function validRange(minimum: string, maximum: string): boolean {
  const min = minimum === '' ? null : Number(minimum)
  const max = maximum === '' ? null : Number(maximum)
  return (min === null || Number.isFinite(min) && min >= 0) &&
    (max === null || Number.isFinite(max) && max >= 0) &&
    (min === null || max === null || min <= max)
}

export function validDashboardFilters(filters: DashboardTableFilters): boolean {
  return validRange(filters.energyMin, filters.energyMax) &&
    validRange(filters.emissionsMin, filters.emissionsMax) &&
    validRange(filters.energyCoverageMin, filters.energyCoverageMax) &&
    validRange(filters.emissionsCoverageMin, filters.emissionsCoverageMax) &&
    [filters.energyCoverageMin, filters.energyCoverageMax, filters.emissionsCoverageMin, filters.emissionsCoverageMax]
      .every((value) => value === '' || Number(value) <= 100)
}

function passesRange(value: number | null, minimum: string, maximum: string, missing: boolean): boolean {
  if (value === null) return missing || minimum === '' && maximum === ''
  const min = minimum === '' ? null : Number(minimum)
  const max = maximum === '' ? null : Number(maximum)
  return (min === null || value >= min) && (max === null || value <= max)
}

function compareValue(left: string | number | null, right: string | number | null, locale: string, direction: 'asc' | 'desc'): number {
  if (left === null && right !== null) return 1
  if (left !== null && right === null) return -1
  if (left === null || right === null) return 0
  const comparison = typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right), locale, { sensitivity: 'base' })
  return comparison * (direction === 'asc' ? 1 : -1)
}

function normalizedIncludes(haystack: string, needle: string): boolean {
  return normalizeDashboardSearch(haystack).includes(normalizeDashboardSearch(needle))
}

function matchesSearch(row: DashboardRow, stateLabel: string, query: string): boolean {
  if (!query) return true
  return [row.name, stateLabel, row.regionCode ?? '', row.energy.value === null ? '' : `${row.energy.value} ${row.energy.unit}`,
    row.emissions.value === null ? '' : `${row.emissions.value} ${row.emissions.unit}`,
    `${row.coverage.energy * 100}`, `${row.coverage.emissions * 100}`].some((value) => normalizedIncludes(value, query))
}

function matchesFilters(row: DashboardRow, filters: DashboardTableFilters): boolean {
  return (!filters.name || normalizedIncludes(row.name, filters.name)) &&
    (filters.state === 'ALL' || filters.state === row.state) &&
    (!filters.region || row.regionCode !== null && normalizedIncludes(row.regionCode, filters.region)) &&
    passesRange(row.energy.value, filters.energyMin, filters.energyMax, filters.energyMissing) &&
    passesRange(row.emissions.value, filters.emissionsMin, filters.emissionsMax, filters.emissionsMissing) &&
    passesRange(row.coverage.energy * 100, filters.energyCoverageMin, filters.energyCoverageMax, false) &&
    passesRange(row.coverage.emissions * 100, filters.emissionsCoverageMin, filters.emissionsCoverageMax, false)
}

export function selectDashboardRows(
  contributions: readonly EnvironmentalSummaryApplication[],
  applications: readonly Pick<Application, 'id' | 'location'>[],
  query: DashboardQuery,
  locale: string,
  labelForState: (state: EnvironmentalSummaryApplication['state']) => string,
): Readonly<{ items: readonly DashboardRow[]; total: number }> {
  const currentRegions = new Map(applications.map((application) => [application.id, application.location?.regionCode ?? null]))
  const rows = contributions.map((item): DashboardRow => ({ ...item, regionCode: currentRegions.get(item.applicationId) ?? null }))
  const filtered = validDashboardFilters(query.filters)
    ? rows.filter((row) => {
      const stateLabel = labelForState(row.state)
      return matchesSearch(row, stateLabel, query.search) && matchesFilters(row, query.filters)
    })
    : []
  const getValue = (row: DashboardRow): string | number | null => {
    switch (query.sort.column) {
      case 'name': return row.name
      case 'state': return labelForState(row.state)
      case 'region': return row.regionCode
      case 'energy': return row.energy.value
      case 'emissions': return row.emissions.value
      case 'energyCoverage': return row.coverage.energy
      case 'emissionsCoverage': return row.coverage.emissions
    }
  }
  const items = [...filtered].sort((left, right) =>
    compareValue(getValue(left), getValue(right), locale, query.sort.direction) ||
    left.applicationId.localeCompare(right.applicationId, locale))
  return { items, total: filtered.length }
}

export function activeDashboardFilterCount(filters: DashboardTableFilters): number {
  return Object.values(filters).filter((value) => value !== '' && value !== false && value !== 'ALL').length
}
