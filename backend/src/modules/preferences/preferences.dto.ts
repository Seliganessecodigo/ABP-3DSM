import { ApiProperty } from '@nestjs/swagger'

export const preferenceTabs = ['energy', 'emissions', 'coverage', 'analysis'] as const
export type PreferenceTab = typeof preferenceTabs[number]

export class LimitPreferenceDto {
  @ApiProperty({ minimum: 0 }) threshold!: number
  @ApiProperty() alertsEnabled!: boolean
  @ApiProperty({ enum: ['application'] }) scope!: 'application'
  @ApiProperty({ enum: ['month'] }) referencePeriod!: 'month'
  @ApiProperty({ enum: ['kWh', 'kgCO2e'] }) unit!: 'kWh' | 'kgCO2e'
}
export class CoveragePreferenceDto {
  @ApiProperty({ minimum: 0, maximum: 100 }) thresholdPercent!: number
  @ApiProperty() alertsEnabled!: boolean
}
export class AnalysisPreferenceDto {
  @ApiProperty({ enum: [7, 30] }) periodDays!: 7 | 30
  @ApiProperty({ enum: ['hour', 'day'] }) granularity!: 'hour' | 'day'
}
export type PreferenceValue = LimitPreferenceDto | CoveragePreferenceDto | AnalysisPreferenceDto

export class SavedPreferenceDto {
  @ApiProperty({ minimum: 1 }) revision!: number
  @ApiProperty({ format: 'date-time' }) updatedAt!: string
  @ApiProperty({ oneOf: [
    { $ref: '#/components/schemas/LimitPreferenceDto' },
    { $ref: '#/components/schemas/CoveragePreferenceDto' },
    { $ref: '#/components/schemas/AnalysisPreferenceDto' },
  ] }) value!: PreferenceValue
}
export class PreferencesDto {
  @ApiProperty({ type: SavedPreferenceDto, nullable: true }) energy!: SavedPreferenceDto | null
  @ApiProperty({ type: SavedPreferenceDto, nullable: true }) emissions!: SavedPreferenceDto | null
  @ApiProperty({ type: SavedPreferenceDto, nullable: true }) coverage!: SavedPreferenceDto | null
  @ApiProperty({ type: SavedPreferenceDto, nullable: true }) analysis!: SavedPreferenceDto | null
}
export class SavePreferenceDto {
  @ApiProperty({ minimum: 0, description: '0 para criar; revisão lida para atualizar' }) expectedRevision!: number
  @ApiProperty({ oneOf: [
    { $ref: '#/components/schemas/LimitPreferenceDto' },
    { $ref: '#/components/schemas/CoveragePreferenceDto' },
    { $ref: '#/components/schemas/AnalysisPreferenceDto' },
  ] }) value!: PreferenceValue
}
