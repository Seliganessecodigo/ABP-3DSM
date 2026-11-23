import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'monitoring_control_versions' })
export class MonitoringControlVersionEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ type: 'boolean' }) paused!: boolean
  @Column({ type: 'uuid', nullable: true }) previousVersion!: string | null
  @Column({ type: 'varchar', length: 16 }) actorType!: 'user' | 'system'
  @Column({ type: 'varchar', length: 128 }) actor!: string
  @Column({ type: 'varchar', length: 512 }) reason!: string
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date
}
