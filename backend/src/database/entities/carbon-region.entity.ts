import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'

@Entity({ name: 'carbon_regions' })
@Unique('uq_carbon_regions_code_version', ['code', 'version'])
@Index('IDX_carbon_regions_code_validity', ['code', 'validFrom', 'validUntil'])
export class CarbonRegionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 128 })
  code!: string

  @Column({ type: 'varchar', length: 128 })
  version!: string

  @Column({ type: 'varchar', length: 128, nullable: true })
  country!: string | null

  @Column({ type: 'varchar', length: 128, nullable: true })
  region!: string | null

  @Column({ type: 'varchar', length: 128, nullable: true })
  city!: string | null

  @Column({ type: 'numeric', precision: 18, scale: 8 })
  intensity!: string

  @Column({ type: 'varchar', length: 64 })
  unit!: string

  @Column({ type: 'varchar', length: 512, nullable: true })
  source!: string | null

  @Column({ type: 'timestamptz', nullable: true })
  validFrom!: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  queriedAt!: Date | null

  @Column({ type: 'varchar', length: 32, nullable: true })
  contractVersion!: string | null

  @Column({ type: 'numeric', precision: 7, scale: 4, nullable: true })
  renewableSharePercent!: string | null

  @Column({ type: 'timestamptz', nullable: true })
  validUntil!: Date | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
