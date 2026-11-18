import { BadRequestException } from '@nestjs/common'
import {
  validateRecoveryCompletion,
  validateRecoveryRequest,
} from './password-recovery.dto'

describe('password recovery input', () => {
  it.each([
    null,
    [],
    {},
    { organization: ' ', email: 'a@example.test' },
    { organization: 'x'.repeat(81), email: 'a@example.test' },
    { organization: 'org', email: 'invalid' },
    { organization: 'org', email: 12 },
    { organization: 'org', email: `${'a'.repeat(310)}@example.test` },
  ])('rejects malformed requests with a stable code', (input) => {
    try {
      validateRecoveryRequest(input)
      throw new Error('Expected validation failure')
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      expect((error as BadRequestException).getResponse()).toEqual({
        code: 'PASSWORD_RECOVERY_REQUEST_INVALID',
      })
    }
  })

  it('accepts the documented organization limit and trimmed email', () => {
    expect(() =>
      validateRecoveryRequest({
        organization: 'a'.repeat(80),
        email: ' A@example.test ',
      }),
    ).not.toThrow()
  })

  it.each([
    null,
    [],
    {},
    { token: ' ', password: 'password' },
    { token: 'a'.repeat(257), password: 'password' },
    { token: 12, password: 'password' },
    { token: 'token', password: 12 },
    { token: 'token', password: 'a'.repeat(7) },
    { token: 'token', password: 'a'.repeat(1025) },
  ])('rejects malformed completions with a stable code', (input) => {
    try {
      validateRecoveryCompletion(input)
      throw new Error('Expected validation failure')
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      expect((error as BadRequestException).getResponse()).toEqual({
        code: 'PASSWORD_RECOVERY_COMPLETION_INVALID',
      })
    }
  })

  it.each([8, 1024])('accepts password boundary %s', (length) => {
    expect(() =>
      validateRecoveryCompletion({
        token: 'a'.repeat(256),
        password: 'x'.repeat(length),
      }),
    ).not.toThrow()
  })
})
