import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { CollectionEntity } from './collection.entity'
import { UserEntity } from './user.entity'

@Entity({ name: 'recalculations' })
@Index('IDX_recalculations_collection_created_at', ['collectionId', 'createdAt'])
export class RecalculationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  collectionId!: string

  @ManyToOne(() => CollectionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'collectionId' })
  collection!: CollectionEntity

  @Column({ type: 'varchar', length: 128, nullable: true })
  previousConfigVersion!: string | null

  @Column({ type: 'varchar', length: 128 })
  configVersion!: string

  @Column({ type: 'jsonb' })
  result!: Record<string, unknown>

  @Column({ type: 'varchar', length: 128 })
  requestedBy!: string

  @Column({ type: 'uuid', nullable: true })
  requestedByUserId!: string | null

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requestedByUserId' })
  requestedByUser!: UserEntity | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
