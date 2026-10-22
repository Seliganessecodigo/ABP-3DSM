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

export enum AuthTokenKind {
  ADMIN_INVITATION = 'ADMIN_INVITATION',
  EMAIL_CONFIRMATION = 'EMAIL_CONFIRMATION',
}

@Entity({ name: 'auth_tokens' })
@Index('IDX_auth_tokens_org_kind_created', [
  'organizationId',
  'kind',
  'createdAt',
])
export class AuthTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'char', length: 64, unique: true })
  tokenHash!: string

  @Column({ type: 'varchar', length: 32 })
  kind!: AuthTokenKind

  @Column({ type: 'uuid' })
  organizationId!: string

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity | null

  @Column({ type: 'varchar', length: 320 })
  email!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @Column({ type: 'timestamptz' })
  expiresAt!: Date

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt!: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null
}
