import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ApplicationState } from '../../database/entities/application-state'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'
import type { CarbonFactorSnapshotInput, CarbonEmissionReason } from '../calculations/carbon-emission'
import type { EnergyCalculationReason } from '../calculations/energy-calculation'
import type { EnergyMetricName } from '../calculations/energy-model'

const ENERGY_REASON_CODES = [
  'INVALID_OBSERVATION_ID',
  'INVALID_APPLICATION_ID',
  'INVALID_TIMESTAMP',
  'INVALID_INTERVAL',
  'INVALID_MODEL',
  'METRIC_MISSING',
  'METRIC_INVALID',
  'METRIC_OUT_OF_RANGE',
  'NON_FINITE_RESULT',
] as const satisfies readonly EnergyCalculationReason['code'][]

const CARBON_REASON_CODES = [
  'ENERGY_UNAVAILABLE',
  'INVALID_ENERGY',
  'CARBON_FACTOR_UNAVAILABLE',
  'INVALID_FACTOR',
  'INVALID_SNAPSHOT',
  'UNSUPPORTED_UNIT',
  'NON_FINITE_RESULT',
] as const satisfies readonly CarbonEmissionReason['code'][]

interface EnvironmentalModelParameters {
  readonly cpuWattsAt100Percent?: number
  readonly memoryWattsPerGb?: number
  readonly diskWattsPerGb?: number
  readonly networkWattsPerGb?: number
  readonly [parameter: string]: number | undefined
}

interface EnvironmentalFormulaInputUnits {
  readonly cpuPercent: string
  readonly memoryGb: string
  readonly diskGb: string
  readonly networkGb: string
  readonly cpuWattsAt100Percent: string
  readonly memoryWattsPerGb: string
  readonly diskWattsPerGb: string
  readonly networkWattsPerGb: string
  readonly durationSeconds: string
}

export class EnergyCalculationReasonDto {
  @ApiProperty({
    enum: ENERGY_REASON_CODES,
    description: 'Código de razão persistido na evidência.',
  })
  code!: EnergyCalculationReason['code']

  @ApiPropertyOptional({ enum: ['cpuPercent', 'memoryGb', 'diskGb', 'networkGb'] })
  metric?: EnergyMetricName
}

export class CarbonEmissionReasonDto {
  @ApiProperty({
    enum: CARBON_REASON_CODES,
    description: 'Código de razão persistido na evidência.',
  })
  code!: CarbonEmissionReason['code']
}

export class EnvironmentalPowerContributionsDto {
  @ApiProperty({ type: Number, nullable: true })
  cpuPercent!: number | null

  @ApiProperty({ type: Number, nullable: true })
  memoryGb!: number | null

  @ApiProperty({ type: Number, nullable: true })
  diskGb!: number | null

  @ApiProperty({ type: Number, nullable: true })
  networkGb!: number | null
}

export class CarbonFactorSnapshotDto {
  @ApiProperty({ type: String, nullable: true })
  id!: CarbonFactorSnapshotInput['id']

  @ApiProperty({ type: String, nullable: true })
  version!: CarbonFactorSnapshotInput['version']

  @ApiProperty({ type: String, nullable: true })
  contractVersion!: CarbonFactorSnapshotInput['contractVersion']

  @ApiProperty({ type: String, nullable: true })
  regionCode!: CarbonFactorSnapshotInput['regionCode']

  @ApiProperty({ type: String, nullable: true })
  country!: CarbonFactorSnapshotInput['country']

  @ApiProperty({ type: String, nullable: true })
  region!: CarbonFactorSnapshotInput['region']

  @ApiProperty({ type: String, nullable: true })
  city!: CarbonFactorSnapshotInput['city']

  @ApiProperty({ type: Number, nullable: true })
  intensity!: CarbonFactorSnapshotInput['intensity']

  @ApiProperty({ type: String, nullable: true })
  unit!: CarbonFactorSnapshotInput['unit']

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  queriedAt!: CarbonFactorSnapshotInput['queriedAt']

  @ApiProperty({ type: String, nullable: true })
  source!: CarbonFactorSnapshotInput['source']

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  validFrom!: CarbonFactorSnapshotInput['validFrom']

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  validUntil!: CarbonFactorSnapshotInput['validUntil']
}

export class MetricEvidenceDto {
  @ApiProperty({ type: Number, nullable: true })
  value!: number | null

  @ApiProperty({ type: String, nullable: true })
  unit!: string | null

  @ApiProperty({ enum: ['available', 'missing', 'invalid'] })
  status!: 'available' | 'missing' | 'invalid'
}

export class MetricsEvidenceDto {
  @ApiProperty({ type: MetricEvidenceDto })
  cpu!: MetricEvidenceDto

  @ApiProperty({ type: MetricEvidenceDto })
  memory!: MetricEvidenceDto

  @ApiProperty({ type: MetricEvidenceDto })
  disk!: MetricEvidenceDto

  @ApiProperty({ type: MetricEvidenceDto })
  network!: MetricEvidenceDto
}

export class EnvironmentalFormulaDto {
  @ApiProperty({ enum: ['available', 'unavailable'] })
  status!: 'available' | 'unavailable'

  @ApiProperty({ type: String, nullable: true })
  expression!: string | null

  @ApiProperty({
    type: 'object',
    nullable: true,
    properties: {
      cpuPercent: { type: 'string', example: '%' },
      memoryGb: { type: 'string', example: 'GB' },
      diskGb: { type: 'string', example: 'GB' },
      networkGb: { type: 'string', example: 'GB' },
      cpuWattsAt100Percent: { type: 'string', example: 'W' },
      memoryWattsPerGb: { type: 'string', example: 'W/GB' },
      diskWattsPerGb: { type: 'string', example: 'W/GB' },
      networkWattsPerGb: { type: 'string', example: 'W/GB' },
      durationSeconds: { type: 'string', example: 's' },
    },
  })
  inputUnits!: Readonly<EnvironmentalFormulaInputUnits> | null

  @ApiProperty({ type: String, nullable: true })
  outputUnit!: string | null

  @ApiProperty({ type: String, nullable: true })
  reason!: 'FORMULA_UNAVAILABLE' | null
}

export class EnvironmentalModelDto {
  @ApiProperty()
  key!: string

  @ApiProperty()
  version!: string

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  configId!: string | null

  @ApiProperty({ type: String, nullable: true })
  configVersion!: string | null

  @ApiProperty({
    type: 'object',
    properties: {
      cpuWattsAt100Percent: { type: 'number' },
      memoryWattsPerGb: { type: 'number' },
      diskWattsPerGb: { type: 'number' },
      networkWattsPerGb: { type: 'number' },
    },
    additionalProperties: { type: 'number' },
    description: 'Parâmetros efetivos preservados no resultado; nomes adicionais podem existir em versões desconhecidas do modelo.',
  })
  parameters!: EnvironmentalModelParameters

  @ApiProperty({ type: EnvironmentalFormulaDto })
  formula!: EnvironmentalFormulaDto

  @ApiProperty({ type: EnvironmentalPowerContributionsDto })
  powerContributionsW!: EnvironmentalPowerContributionsDto

  @ApiProperty({ type: [EnergyCalculationReasonDto] })
  reasons!: readonly EnergyCalculationReasonDto[]
}

export class EnvironmentalEnergyDto {
  @ApiProperty({ type: Number, nullable: true, description: 'Valor quantizado persistido em collections.energyKwh.' })
  valueKwh!: number | null

  @ApiProperty({ type: Number, nullable: true, description: 'Valor original persistido no JSONB de evidência de cálculo.' })
  calculatedValueKwh!: number | null

  @ApiProperty({ type: Number, nullable: true, description: 'Cobertura persistida em collections.coverage, como fração entre 0 e 1.' })
  coverage!: number | null

  @ApiProperty({ type: Number, nullable: true })
  durationSeconds!: number | null

  @ApiProperty({ type: Number, nullable: true })
  averagePowerW!: number | null

  @ApiProperty({ type: EnvironmentalModelDto })
  model!: EnvironmentalModelDto
}

export class EnvironmentalCarbonFormulaDto {
  @ApiProperty()
  expression!: string

  @ApiProperty({ enum: ['kWh'] })
  energyUnit!: 'kWh'

  @ApiProperty({ enum: ['gCO2e/kWh'] })
  factorUnit!: 'gCO2e/kWh'

  @ApiProperty({ enum: ['gCO2e'] })
  gramsUnit!: 'gCO2e'

  @ApiProperty({ enum: ['kgCO2e'] })
  kilogramsUnit!: 'kgCO2e'
}

export class EnvironmentalCarbonDto {
  @ApiProperty({ type: Number, nullable: true, description: 'Valor quantizado persistido em collections.carbonGrams.' })
  valueGramsCo2e!: number | null

  @ApiProperty({ type: Number, nullable: true, description: 'Valor original persistido no JSONB de evidência de cálculo.' })
  calculatedValueGramsCo2e!: number | null

  @ApiProperty({ type: Number, nullable: true, description: 'Valor original em kgCO2e persistido no JSONB de evidência de cálculo.' })
  calculatedValueKilogramsCo2e!: number | null

  @ApiProperty({ type: Number, nullable: true, description: 'Fator quantizado persistido em collections.carbonFactor.' })
  factor!: number | null

  @ApiProperty({ type: CarbonFactorSnapshotDto, nullable: true })
  factorSnapshot!: CarbonFactorSnapshotInput | null

  @ApiProperty({ type: EnvironmentalCarbonFormulaDto })
  formula!: EnvironmentalCarbonFormulaDto

  @ApiProperty({ type: [CarbonEmissionReasonDto] })
  reasons!: readonly CarbonEmissionReasonDto[]
}

export class EnvironmentalEvidenceDto {
  @ApiProperty({ enum: ['present', 'absent'] })
  status!: 'present' | 'absent'

  @ApiProperty({ type: String, nullable: true, enum: ['ENVIRONMENTAL_EVIDENCE_UNAVAILABLE'] })
  absenceReason!: 'ENVIRONMENTAL_EVIDENCE_UNAVAILABLE' | null

  @ApiProperty({ type: EnvironmentalEnergyDto, nullable: true })
  energy!: EnvironmentalEnergyDto | null

  @ApiProperty({ type: EnvironmentalCarbonDto, nullable: true })
  carbon!: EnvironmentalCarbonDto | null
}

export class CollectionEvidenceDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty()
  applicationId!: string

  @ApiProperty({ type: String, format: 'date-time' })
  intervalStart!: Date

  @ApiProperty({ type: String, format: 'date-time' })
  intervalEnd!: Date

  @ApiProperty({ type: String, format: 'date-time' })
  collectedAt!: Date

  @ApiProperty({
    type: Number,
    description: 'Duração informada pela origem, em segundos.',
  })
  collectionIntervalSeconds!: number | null

  @ApiProperty({ type: Boolean })
  isStale!: boolean

  @ApiProperty({ enum: ApplicationState })
  state!: ApplicationState

  @ApiProperty({ enum: ApplicationStateReason })
  reason!: ApplicationStateReason

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lastCheckedAt!: Date | null

  @ApiProperty({ type: MetricsEvidenceDto })
  metrics!: MetricsEvidenceDto

  @ApiProperty({ type: EnvironmentalEvidenceDto })
  environmental!: EnvironmentalEvidenceDto
}
