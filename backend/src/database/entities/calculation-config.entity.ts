import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm'

@Entity({ name: 'calculation_configs' })
@Unique('uq_calculation_configs_key_version', ['key', 'version'])
@Index('IDX_calculation_configs_key_effective', ['key', 'effectiveFrom', 'effectiveUntil'])
export class CalculationConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 128 })
  key!: string

  @Column({ type: 'varchar', length: 128 })
  version!: string

  @Column({ type: 'jsonb' })
  parameters!: Record<string, unknown>

  @Column({ type: 'timestamptz' })
  effectiveFrom!: Date

  @Column({ type: 'timestamptz', nullable: true })
  effectiveUntil!: Date | null

  @Column({ type: 'varchar', length: 128 })
  author!: string

  @Column({ type: 'varchar', length: 512, nullable: true })
  reason!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
