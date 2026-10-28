import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { OrganizationEntity } from './organization.entity'
import { UserEntity, UserRole } from './user.entity'

@Entity({ name: 'sso_invitations' })
export class SsoInvitationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'char', length: 64, unique: true })
  tokenHash!: string

  @Column({ type: 'uuid' })
  organizationId!: string

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity

  @Column({ type: 'varchar', length: 320 })
  email!: string

  @Column({ type: 'varchar', length: 160 })
  name!: string

  @Column({ type: 'enum', enum: UserRole, enumName: 'users_role_enum' })
  role!: UserRole

  @Column({ type: 'uuid', nullable: true })
  createdByUserId!: string | null

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy!: UserEntity | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @Column({ type: 'timestamptz' })
  expiresAt!: Date

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt!: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null
}
