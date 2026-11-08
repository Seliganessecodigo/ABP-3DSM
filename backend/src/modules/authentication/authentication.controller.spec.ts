import { BadRequestException } from '@nestjs/common'
import {
  UserAccountStatus,
  UserRole,
} from '../../database/entities/user.entity'
import {
  AccountStatusResponseDto,
  ChangeAccountStatusDto,
} from './authentication.dto'
import { AuthenticationController } from './authentication.controller'
import { AuthPrincipal, AuthenticationService } from './authentication.service'
import { AccountLifecycleService } from './account-lifecycle.service'
import { SsoAuthenticationService } from './sso-authentication.service'

describe('AuthenticationController account status', () => {
  const principal: AuthPrincipal = {
    userId: 'admin-id',
    organizationId: 'organization-id',
    sessionId: 'session-id',
    role: UserRole.ADMIN,
    email: 'admin@example.test',
    name: 'Admin',
  }

  function createController() {
    const accountLifecycle = {
      changeStatus: jest.fn().mockResolvedValue({
        userId: 'target-id',
        status: UserAccountStatus.BLOCKED,
        changed: true,
      } satisfies AccountStatusResponseDto),
    }
    return {
      controller: new AuthenticationController(
        {} as unknown as AuthenticationService,
        {} as unknown as SsoAuthenticationService,
        accountLifecycle as unknown as AccountLifecycleService,
      ),
      accountLifecycle,
    }
  }

  it('validates and normalizes status-change input before delegating', async () => {
    const { controller, accountLifecycle } = createController()
    const body: ChangeAccountStatusDto = {
      status: UserAccountStatus.BLOCKED,
      expectedStatus: UserAccountStatus.ACTIVE,
      reason: '  Temporary suspension  ',
    }

    await expect(
      controller.changeAccountStatus(principal, 'target-id', body),
    ).resolves.toEqual({
      userId: 'target-id',
      status: UserAccountStatus.BLOCKED,
      changed: true,
    })
    expect(accountLifecycle.changeStatus).toHaveBeenCalledWith(
      principal,
      'target-id',
      {
        status: UserAccountStatus.BLOCKED,
        expectedStatus: UserAccountStatus.ACTIVE,
        reason: 'Temporary suspension',
      },
    )
  })

  it.each([
    ['', UserAccountStatus.ACTIVE, 'empty'],
    ['a'.repeat(513), UserAccountStatus.ACTIVE, 'overlong'],
    ['Valid reason', 'INVALID' as UserAccountStatus, 'invalid expected status'],
  ])('rejects invalid input (%s)', (reason, expectedStatus) => {
    const { controller, accountLifecycle } = createController()
    const body: ChangeAccountStatusDto = {
      status: UserAccountStatus.BLOCKED,
      expectedStatus,
      reason,
    }

    expect(() =>
      controller.changeAccountStatus(principal, 'target-id', body),
    ).toThrow(BadRequestException)
    expect(accountLifecycle.changeStatus).not.toHaveBeenCalled()
  })
})
