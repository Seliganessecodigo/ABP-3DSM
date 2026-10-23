import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuditLogEntity } from '../../database/entities/audit-log.entity'
import { AuthSessionEntity } from '../../database/entities/auth-session.entity'
import { AuthTokenEntity } from '../../database/entities/auth-token.entity'
import { OrganizationEntity } from '../../database/entities/organization.entity'
import { UserEntity } from '../../database/entities/user.entity'
import { AccessTokenService } from './access-token.service'
import { AuthenticationController } from './authentication.controller'
import { AuthenticationPersistence } from './authentication.persistence'
import { AuthenticationService } from './authentication.service'
import { EMAIL_DELIVERY } from './email-delivery'
import { PasswordHasher } from './password-hasher.service'
import { RolesGuard } from './roles.guard'
import { SmtpEmailDelivery } from './smtp-email-delivery.service'
import { AuthenticationGuard } from './authentication.guard'
import { AUTH_CLOCK, SystemAuthClock } from './clock'
import { TotpService } from './totp.service'
import { TotpAuthenticationService } from './totp-authentication.service'
import { ExternalIdentityEntity } from '../../database/entities/external-identity.entity'
import { SsoHandoffEntity } from '../../database/entities/sso-handoff.entity'
import { SsoInvitationEntity } from '../../database/entities/sso-invitation.entity'
import { SsoTransactionEntity } from '../../database/entities/sso-transaction.entity'
import { FetchGoogleOidcTransport, GOOGLE_OIDC_TRANSPORT } from './google-oidc-transport'
import { GoogleOidcClient } from './google-oidc-client'
import { SsoAuthenticationService } from './sso-authentication.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuditLogEntity,
      AuthSessionEntity,
      AuthTokenEntity,
      OrganizationEntity,
      UserEntity,
      ExternalIdentityEntity,
      SsoHandoffEntity,
      SsoInvitationEntity,
      SsoTransactionEntity,
    ]),
  ],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationPersistence,
    AuthenticationService,
    TotpAuthenticationService,
    SsoAuthenticationService,
    GoogleOidcClient,
    { provide: GOOGLE_OIDC_TRANSPORT, useClass: FetchGoogleOidcTransport },
    AccessTokenService,
    TotpService,
    PasswordHasher,
    AuthenticationGuard,
    RolesGuard,
    { provide: AUTH_CLOCK, useClass: SystemAuthClock },
    SmtpEmailDelivery,
    { provide: EMAIL_DELIVERY, useExisting: SmtpEmailDelivery },
  ],
  exports: [
    AuthenticationService,
    AuthenticationGuard,
    RolesGuard,
    TotpAuthenticationService,
  ],
})
export class AuthenticationModule {}
