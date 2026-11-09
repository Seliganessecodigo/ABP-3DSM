import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'password_recovery_outbox' })
@Index('IDX_password_recovery_outbox_due', ['status', 'nextAttemptAt'])
export class PasswordRecoveryOutboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  authTokenId!: string

  @Column({ type: 'text' })
  encryptedPayload!: string

  @Column({ type: 'varchar', length: 32 })
  keyVersion!: string

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status!: 'PENDING' | 'SENT' | 'FAILED'

  @Column({ type: 'integer', default: 0 })
  attempts!: number

  @Column({ type: 'timestamptz' })
  nextAttemptAt!: Date

  @Column({ type: 'timestamptz' })
  expiresAt!: Date

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
