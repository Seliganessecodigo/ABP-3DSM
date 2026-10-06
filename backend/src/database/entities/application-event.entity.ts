import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { ApplicationEntity } from './application.entity'

@Entity({ name: 'application_events' })
@Index('IDX_application_events_application_occurred_at', ['applicationId', 'occurredAt'])
export class ApplicationEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 128 })
  applicationId!: string

  @ManyToOne(() => ApplicationEntity, (application) => application.events, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'applicationId' })
  application!: ApplicationEntity

  @Column({ type: 'varchar', length: 64 })
  kind!: string

  @CreateDateColumn({ type: 'timestamptz' })
  occurredAt!: Date

  @Column({ type: 'varchar', length: 128 })
  actor!: string

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, unknown> | null
}
