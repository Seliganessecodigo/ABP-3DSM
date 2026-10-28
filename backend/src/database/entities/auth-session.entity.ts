import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { OrganizationEntity } from './organization.entity'
import { UserEntity } from './user.entity'

@Entity({ name: 'auth_sessions' })
@Index('IDX_auth_sessions_user_active', ['userId', 'revokedAt'])
export class AuthSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  userId!: string

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity

  @Column({ type: 'uuid' })
  organizationId!: string

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity

  @Column({ type: 'char', length: 64, unique: true })
  refreshTokenHash!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @Column({ type: 'timestamptz' })
  lastActivityAt!: Date

  @Column({ type: 'timestamptz' })
  absoluteExpiresAt!: Date

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  secondFactorVerifiedAt!: Date | null
}
