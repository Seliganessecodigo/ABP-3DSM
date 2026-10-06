import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { UserEntity } from './user.entity'

@Entity({ name: 'audit_logs' })
@Index('IDX_audit_logs_entity_created_at', ['entityType', 'entityId', 'createdAt'])
@Index('IDX_audit_logs_actor_created_at', ['actor', 'createdAt'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 128 })
  actor!: string

  @Column({ type: 'uuid', nullable: true })
  actorUserId!: string | null

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actorUserId' })
  actorUser!: UserEntity | null

  @Column({ type: 'varchar', length: 128 })
  action!: string

  @Column({ type: 'varchar', length: 128 })
  entityType!: string

  @Column({ type: 'varchar', length: 128 })
  entityId!: string

  @Column({ type: 'jsonb', nullable: true })
  before!: Record<string, unknown> | null

  @Column({ type: 'jsonb', nullable: true })
  after!: Record<string, unknown> | null

  @Column({ type: 'varchar', length: 512, nullable: true })
  reason!: string | null

  @Column({ type: 'varchar', length: 64 })
  outcome!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
