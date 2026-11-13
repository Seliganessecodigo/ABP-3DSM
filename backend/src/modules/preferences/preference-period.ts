import { BadRequestException } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { parseZonedTimestampNanoseconds } from '../calculations/energy-calculation'

export const preferencePeriodKinds = ['24h', '7d', '30d', '90d', 'month', 'custom'] as const
export class PreferencePeriodDto {
  @ApiProperty({ enum: preferencePeriodKinds }) kind!: typeof preferencePeriodKinds[number]
  @ApiPropertyOptional({ format: 'date-time', description: 'Início inclusivo com fuso; obrigatório para custom' }) from?: string
  @ApiPropertyOptional({ format: 'date-time', description: 'Fim exclusivo com fuso; obrigatório para custom' }) to?: string
}
export function validatePreferencePeriod(value: unknown): PreferencePeriodDto {
  const invalid = () => new BadRequestException({ code: 'INVALID_PREFERENCE_PERIOD' })
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid()
  const input = value as Record<string, unknown>
  const kind = preferencePeriodKinds.find(item => item === input.kind)
  if (!kind) throw invalid()
  if (kind !== 'custom') {
    if (Object.keys(input).length !== 1) throw invalid()
    return { kind }
  }
  if (Object.keys(input).length !== 3 || typeof input.from !== 'string' || typeof input.to !== 'string') throw invalid()
  const start = parseZonedTimestampNanoseconds(input.from)
  const end = parseZonedTimestampNanoseconds(input.to)
  if (start === null || end === null || end <= start) throw invalid()
  return { kind, from: input.from, to: input.to }
}
export function preferencePeriodRange(period: PreferencePeriodDto, now: Date): { from: string; to: string } {
  if (period.kind === 'custom') return { from: period.from!, to: period.to! }
  const from = period.kind === 'month' ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)) :
    new Date(now.getTime() - ({ '24h': 1, '7d': 7, '30d': 30, '90d': 90 }[period.kind]) * 86400000)
  return { from: from.toISOString(), to: now.toISOString() }
}
