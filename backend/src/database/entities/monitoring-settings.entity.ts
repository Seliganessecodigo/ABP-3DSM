import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'monitoring_settings' })
export class MonitoringSettingsEntity {
  @PrimaryColumn({ type: 'varchar', length: 32, default: 'global' })
  id!: string

  @Column({ type: 'boolean', default: false })
  paused!: boolean

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
