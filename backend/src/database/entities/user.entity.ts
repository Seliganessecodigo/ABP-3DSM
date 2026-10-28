import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'
import { OrganizationEntity } from './organization.entity'

export enum UserRole {
  ADMIN = 'ADMIN',
  ANALYST = 'ANALYST',
  VISITOR = 'VISITOR',
}

@Entity({ name: 'users' })
@Unique('uq_users_email', ['email'])
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 160 })
  name!: string

  @Column({ type: 'varchar', length: 320 })
  email!: string

  @Column({ type: 'uuid' })
  organizationId!: string

  @ManyToOne(() => OrganizationEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash!: string | null

  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt!: Date | null

  @Column({ type: 'enum', enum: UserRole, default: UserRole.VISITOR })
  role!: UserRole

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @Column({ type: 'timestamptz', nullable: true })
  lastAccessAt!: Date | null

  @Column({ type: 'text', nullable: true })
  totpSecretCiphertext!: string | null

  @Column({ type: 'varchar', length: 32, nullable: true })
  totpKeyVersion!: string | null

  @Column({ type: 'bigint', nullable: true })
  totpLastUsedStep!: string | null

  @Column({ type: 'text', nullable: true })
  totpPendingCiphertext!: string | null

  @Column({ type: 'varchar', length: 32, nullable: true })
  totpPendingKeyVersion!: string | null

  @Column({ type: 'timestamptz', nullable: true })
  totpPendingExpiresAt!: Date | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
