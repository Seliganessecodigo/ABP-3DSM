import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { ApplicationEntity } from './application.entity'
import { ApplicationState } from './application-state'

@Entity({ name: 'collections' })
@Unique('uq_collections_application_interval_start', ['application', 'intervalStart'])
export class CollectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 128 })
  applicationId!: string

  @ManyToOne(() => ApplicationEntity, (application) => application.collections, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'applicationId' })
  application!: ApplicationEntity

  @Column({ type: 'timestamptz' })
  intervalStart!: Date

  @Column({ type: 'timestamptz' })
  intervalEnd!: Date

  @Column({ type: 'jsonb' })
  metrics!: Record<string, unknown>

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

  @Column({ type: 'numeric', precision: 7, scale: 4, nullable: true })
  coverage!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
