import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { UserEntity } from './user.entity'
import type { PreferenceTab, PreferenceValue } from '../../modules/preferences/preferences.dto'

@Entity('user_preferences')
export class UserPreferenceEntity {
  @PrimaryColumn('uuid') userId!: string
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' }) user!: UserEntity
  @PrimaryColumn('varchar') tab!: PreferenceTab
  @Column('jsonb') value!: PreferenceValue
  @Column('integer') revision!: number
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date
}
