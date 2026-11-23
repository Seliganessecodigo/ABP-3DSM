import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'sso_transactions' })
export class SsoTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'char', length: 64, unique: true })
  stateHash!: string

  @Column({ type: 'varchar', length: 128 })
  nonce!: string

  @Column({ type: 'varchar', length: 128 })
  googleCodeVerifier!: string

  @Column({ type: 'char', length: 43 })
  handoffCodeChallenge!: string

  @Column({ type: 'char', length: 64, nullable: true })
  invitationTokenHash!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @Column({ type: 'timestamptz' })
  expiresAt!: Date

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt!: Date | null
}
