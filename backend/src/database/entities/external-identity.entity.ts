import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { OrganizationEntity } from './organization.entity'
import { UserEntity } from './user.entity'

@Entity({ name: 'external_identities' })
@Unique('UQ_external_identities_issuer_subject', ['issuer', 'subject'])
@Unique('UQ_external_identities_user_provider', ['userId', 'provider'])
export class ExternalIdentityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 32 })
  provider!: string

  @Column({ type: 'varchar', length: 255 })
  issuer!: string

  @Column({ type: 'varchar', length: 255 })
  subject!: string

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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
