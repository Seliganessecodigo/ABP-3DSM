import { ApiProperty } from '@nestjs/swagger'
import { UserRole } from '../../database/entities/user.entity'

export class CreateSsoInvitationDto {
  @ApiProperty({ example: 'person@example.com' })
  email!: string

  @ApiProperty({ example: 'GreenER User' })
  name!: string

  @ApiProperty({ enum: UserRole })
  role!: UserRole
}

export class ExchangeSsoHandoffDto {
  @ApiProperty()
  code!: string

  @ApiProperty({ minLength: 43, maxLength: 128 })
  codeVerifier!: string
}
