import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { ApplicationEventEntity } from './application-event.entity'
import { ApplicationState } from './application-state'
import { CollectionEntity } from './collection.entity'

@Entity({ name: 'applications' })
export class ApplicationEntity {
  @PrimaryColumn({ type: 'varchar', length: 128 })
  id!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null

  @Column({ type: 'text', nullable: true })
  regionCode!: string | null

  @Column({ type: 'text', nullable: true })
  country!: string | null

  @Column({ type: 'text', nullable: true })
  region!: string | null

  @Column({ type: 'text', nullable: true })
  city!: string | null

  @Column({ type: 'double precision', nullable: true })
  latitude!: number | null

  @Column({ type: 'double precision', nullable: true })
  longitude!: number | null

  @Column({ type: 'enum', enum: ApplicationState, default: ApplicationState.AVAILABLE })
  state!: ApplicationState

  @CreateDateColumn({ type: 'timestamptz' })
  firstSeenAt!: Date

  @Column({ type: 'timestamptz', nullable: true })
  lastCheckedAt!: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  removedAt!: Date | null

  @OneToMany(() => ApplicationEventEntity, (event) => event.application)
  events!: ApplicationEventEntity[]

  @OneToMany(() => CollectionEntity, (collection) => collection.application)
  collections!: CollectionEntity[]

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
