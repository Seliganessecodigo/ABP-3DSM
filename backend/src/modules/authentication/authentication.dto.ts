import { ApiProperty } from '@nestjs/swagger'
import { UserRole } from '../../database/entities/user.entity'

export class LoginDto {
  @ApiProperty({ example: 'acme' })
  organization!: string

  @ApiProperty({ example: 'admin@example.com' })
  email!: string

  @ApiProperty({ minLength: 8, example: 'uma frase-senha longa' })
  password!: string
}

export class RefreshSessionDto {
  @ApiProperty()
  refreshToken!: string
}

export class AcceptAdminInvitationDto {
  @ApiProperty()
  token!: string

  @ApiProperty()
  name!: string

  @ApiProperty({ example: 'admin@example.com' })
  email!: string
}

export class ConfirmEmailDto {
  @ApiProperty()
  token!: string

  @ApiProperty({ minLength: 8, example: 'uma frase-senha longa' })
  password!: string
}

export class RequestEmailConfirmationDto {
  @ApiProperty({ example: 'acme' })
  organization!: string

  @ApiProperty({ example: 'admin@example.com' })
  email!: string
}

export class SessionResponseDto {
  @ApiProperty()
  accessToken!: string

  @ApiProperty()
  refreshToken!: string

  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer'

  @ApiProperty({ example: 900 })
  expiresIn!: number
}

export class AuthenticatedUserDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  organizationId!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  email!: string

  @ApiProperty({ enum: UserRole })
  role!: UserRole
}

export class TotpSetupRequestDto {
  @ApiProperty({ description: 'Credencial limitada obtida após senha válida de Admin' })
  setupToken!: string
}

export class TotpConfirmDto {
  @ApiProperty({ description: 'Credencial de configuração pendente' })
  setupToken!: string

  @ApiProperty({ minLength: 6, maxLength: 6, example: '123456' })
  code!: string
}

export class TotpChallengeDto {
  @ApiProperty()
  challengeToken!: string

  @ApiProperty({ minLength: 6, maxLength: 6, example: '123456' })
  code!: string
}

export class TotpReplacementDto {
  @ApiProperty({ minLength: 8 })
  password!: string

  @ApiProperty({ minLength: 6, maxLength: 6, example: '123456' })
  currentCode!: string
}

export class TotpReplacementConfirmDto {
  @ApiProperty()
  confirmationToken!: string

  @ApiProperty({ minLength: 6, maxLength: 6, example: '123456' })
  code!: string
}

export class TotpProvisioningResponseDto {
  @ApiProperty()
  setupToken!: string

  @ApiProperty({ description: 'URI otpauth autorizada para configurar o autenticador' })
  provisioningUri!: string

  @ApiProperty({ example: 600 })
  expiresIn!: number
}

export class TotpReplacementResponseDto {
  @ApiProperty()
  confirmationToken!: string

  @ApiProperty({ description: 'URI otpauth autorizada para configurar o autenticador' })
  provisioningUri!: string

  @ApiProperty({ example: 600 })
  expiresIn!: number
}

export class TotpChallengeResponseDto {
  @ApiProperty({ enum: ['TOTP_REQUIRED'] })
  status!: 'TOTP_REQUIRED'

  @ApiProperty()
  challengeToken!: string

  @ApiProperty({ example: 300 })
  expiresIn!: number
}

export class TotpSetupRequiredResponseDto {
  @ApiProperty({ enum: ['TOTP_SETUP_REQUIRED'] })
  status!: 'TOTP_SETUP_REQUIRED'

  @ApiProperty()
  setupToken!: string

  @ApiProperty({ example: 300 })
  expiresIn!: number
}
