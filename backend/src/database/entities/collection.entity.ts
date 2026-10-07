import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { ApplicationEntity } from './application.entity'
import { ApplicationState } from './application-state'
import { CarbonRegionEntity } from './carbon-region.entity'
import { CalculationConfigEntity } from './calculation-config.entity'

@Entity({ name: 'collections' })
@Unique('uq_collections_application_interval_start', [
  'application',
  'intervalStart',
])
@Index('IDX_collections_interval', ['intervalStart', 'intervalEnd'])
export class CollectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'text' })
  applicationId!: string

  @ManyToOne(
    () => ApplicationEntity,
    (application) => application.collections,
    {
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({ name: 'applicationId' })
  application!: ApplicationEntity

  @Column({ type: 'timestamptz' })
  intervalStart!: Date

  @Column({ type: 'timestamptz' })
  intervalEnd!: Date

  @Column({ type: 'timestamptz' })
  collectedAt!: Date

  @Column({ type: 'jsonb' })
  metrics!: Record<string, unknown>

  @Column({ type: 'jsonb' })
  metricUnits!: Record<string, string>

  @Column({ type: 'enum', enum: ApplicationState })
  state!: ApplicationState

  @Column({ type: 'varchar', length: 128, nullable: true })
  reason!: string | null

  @Column({ type: 'numeric', precision: 18, scale: 8, nullable: true })
  energyKwh!: string | null

  @Column({ type: 'numeric', precision: 18, scale: 8, nullable: true })
  carbonGrams!: string | null

  @Column({ type: 'numeric', precision: 18, scale: 8, nullable: true })
  carbonFactor!: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  calculationVersion!: string | null

  @Column({ type: 'varchar', length: 128, nullable: true })
  carbonRegionVersion!: string | null

  @Column({ type: 'uuid', nullable: true })
  carbonRegionId!: string | null

  @ManyToOne(() => CarbonRegionEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'carbonRegionId' })
  carbonRegion!: CarbonRegionEntity | null

  @Column({ type: 'varchar', length: 128, nullable: true })
  calculationConfigVersion!: string | null

  @Column({ type: 'uuid', nullable: true })
  calculationConfigId!: string | null

  @ManyToOne(() => CalculationConfigEntity, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'calculationConfigId' })
  calculationConfig!: CalculationConfigEntity | null

  @Column({ type: 'numeric', precision: 7, scale: 4, nullable: true })
  coverage!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
