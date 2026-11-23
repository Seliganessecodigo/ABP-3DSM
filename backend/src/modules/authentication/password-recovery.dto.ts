import { BadRequestException } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class RequestPasswordRecoveryDto {
  @ApiProperty({ maxLength: 80, description: 'Slug da organização' })
  organization!: string

  @ApiProperty({ format: 'email', maxLength: 320 })
  email!: string
}

export class CompletePasswordRecoveryDto {
  @ApiProperty({
    maxLength: 256,
    writeOnly: true,
    description: 'Token opaco de uso único, válido por uma hora',
  })
  token!: string

  @ApiProperty({ minLength: 8, maxLength: 1024, writeOnly: true })
  password!: string
}

export function validateRecoveryRequest(
  body: unknown,
): asserts body is RequestPasswordRecoveryDto {
  if (
    !isObject(body) ||
    typeof body.organization !== 'string' ||
    !body.organization.trim() ||
    body.organization.trim().length > 80 ||
    typeof body.email !== 'string' ||
    body.email.length > 320 ||
    !isRecoveryEmail(body.email.trim())
  ) {
    throw new BadRequestException({ code: 'PASSWORD_RECOVERY_REQUEST_INVALID' })
  }
}

export function validateRecoveryCompletion(
  body: unknown,
): asserts body is CompletePasswordRecoveryDto {
  if (
    !isObject(body) ||
    typeof body.token !== 'string' ||
    !body.token.trim() ||
    body.token.length > 256 ||
    typeof body.password !== 'string' ||
    body.password.length < 8 ||
    body.password.length > 1024
  ) {
    throw new BadRequestException({
      code: 'PASSWORD_RECOVERY_COMPLETION_INVALID',
    })
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isRecoveryEmail(email: string): boolean {
  const parts = email.split('@')
  return (
    parts.length === 2 &&
    parts[0].length > 0 &&
    !/\s/.test(email) &&
    parts[1].slice(1, -1).includes('.')
  )
}
