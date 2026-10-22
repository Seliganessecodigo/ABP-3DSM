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
