import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity({ name: 'organizations' })
export class OrganizationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 160 })
  name!: string

  @Column({ type: 'varchar', length: 80, unique: true })
  slug!: string

  @Column({ type: 'varchar', length: 320, nullable: true })
  recoveryRepresentativeEmail!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
