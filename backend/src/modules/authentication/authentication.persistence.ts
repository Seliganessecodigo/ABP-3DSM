import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository } from 'typeorm'
import { AuthSessionEntity } from '../../database/entities/auth-session.entity'
import { AuthTokenEntity } from '../../database/entities/auth-token.entity'
import { OrganizationEntity } from '../../database/entities/organization.entity'
import { UserEntity } from '../../database/entities/user.entity'

@Injectable()
export class AuthenticationPersistence {
  constructor(
    @InjectRepository(OrganizationEntity)
    readonly organizations: Repository<OrganizationEntity>,
    @InjectRepository(UserEntity)
    readonly users: Repository<UserEntity>,
    @InjectRepository(AuthSessionEntity)
    readonly sessions: Repository<AuthSessionEntity>,
    @InjectRepository(AuthTokenEntity)
    readonly tokens: Repository<AuthTokenEntity>,
  ) {}

  findOrganizationBySlug(slug: string) {
    return this.organizations.findOne({ where: { slug } })
  }

  findUser(organizationId: string, email: string) {
    return this.users.findOne({ where: { organizationId, email } })
  }

  findUserById(id: string) {
    return this.users.findOne({ where: { id } })
  }

  updateUser(user: UserEntity) {
    return this.users.save(user)
  }

  findSessionForRefresh(refreshTokenHash: string) {
    return this.sessions.findOne({
      where: { refreshTokenHash },
      relations: { user: true },
    })
  }

  findSessionForAccess(
    sessionId: string,
    userId: string,
    organizationId: string,
  ) {
    return this.sessions.findOne({
      where: { id: sessionId, userId, organizationId },
      relations: { user: true },
    })
  }

  createSession(session: Partial<AuthSessionEntity>) {
    return this.sessions.save(this.sessions.create(session))
  }

  updateSession(
    id: string,
    previousRefreshTokenHash: string,
    refreshTokenHash: string,
    lastActivityAt: Date,
  ) {
    return this.sessions.update(
      { id, refreshTokenHash: previousRefreshTokenHash, revokedAt: IsNull() },
      { refreshTokenHash, lastActivityAt },
    )
  }

  touchSession(id: string, lastActivityAt: Date) {
    return this.sessions.update({ id, revokedAt: IsNull() }, { lastActivityAt })
  }

  revokeSession(id: string, at: Date) {
    return this.sessions.update({ id, revokedAt: IsNull() }, { revokedAt: at })
  }

  revokeSessionsForUser(userId: string, at: Date) {
    return this.sessions.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: at },
    )
  }
}
