import { ApiProperty } from '@nestjs/swagger'
import { PreferencePeriodDto } from './preference-period'
import { CoveragePreferenceDto, LimitPreferenceDto } from './preferences.dto'

export class PreferenceAlertsInputDto {
  @ApiProperty({ type: LimitPreferenceDto, nullable: true }) energy!: LimitPreferenceDto | null
  @ApiProperty({ type: LimitPreferenceDto, nullable: true }) emissions!: LimitPreferenceDto | null
  @ApiProperty({ type: CoveragePreferenceDto, nullable: true }) coverage!: CoveragePreferenceDto | null
}
export class PreferenceAlertDto {
  @ApiProperty({ enum: ['energy', 'emissions', 'energyCoverage', 'emissionsCoverage'] }) metric!: 'energy' | 'emissions' | 'energyCoverage' | 'emissionsCoverage'
  @ApiProperty({ enum: ['exceeded', 'within', 'insufficient-data'] }) status!: 'exceeded' | 'within' | 'insufficient-data'
  @ApiProperty({ type: Number, nullable: true }) value!: number | null
  @ApiProperty() threshold!: number
  @ApiProperty({ enum: ['kWh', 'kgCO2e', '%'] }) unit!: 'kWh' | 'kgCO2e' | '%'
  @ApiProperty({ minimum: 0, maximum: 100 }) coveragePercent!: number
  @ApiProperty({ type: PreferencePeriodDto }) period!: PreferencePeriodDto
  @ApiProperty({ format: 'date-time' }) from!: string
  @ApiProperty({ format: 'date-time' }) to!: string
}
export class PreferenceAlertApplicationDto {
  @ApiProperty() applicationId!: string
  @ApiProperty() name!: string
  @ApiProperty({ type: [PreferenceAlertDto] }) evaluations!: PreferenceAlertDto[]
}
export class PreferenceAlertsDto {
  @ApiProperty() configured!: boolean
  @ApiProperty({ format: 'date-time' }) evaluatedAt!: string
  @ApiProperty({ type: [PreferenceAlertApplicationDto] }) applications!: PreferenceAlertApplicationDto[]
}
