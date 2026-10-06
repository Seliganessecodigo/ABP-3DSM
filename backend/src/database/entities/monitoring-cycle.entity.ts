import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

export enum MonitoringCycleStatus {
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
}

@Entity({ name: 'monitoring_cycles' })
@Index('IDX_monitoring_cycles_started_at', ['startedAt'])
export class MonitoringCycleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'enum', enum: MonitoringCycleStatus, default: MonitoringCycleStatus.RUNNING })
  status!: MonitoringCycleStatus

  @Column({ type: 'timestamptz' })
  startedAt!: Date

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt!: Date | null

  @Column({ type: 'bigint', nullable: true })
  durationMs!: string | null

  @Column({ type: 'integer', default: 0 })
  discoveredCount!: number

  @Column({ type: 'integer', default: 0 })
  processedCount!: number

  @Column({ type: 'integer', default: 0 })
  failedCount!: number

  @Column({ type: 'integer', default: 0 })
  persistedCount!: number

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, unknown> | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
