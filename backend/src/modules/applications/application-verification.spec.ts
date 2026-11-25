import { ApplicationState } from '../../database/entities/application-state'
import { isVerificationOverdue, verificationDeadline } from './application-verification'

test('only a previously available application loses confirmation when its check expires', () => {
  const deadline = verificationDeadline(Date.parse('2026-11-25T13:30:00Z'))
  const old = new Date('2026-11-25T11:08:00Z')
  const status = (state: ApplicationState, lastCheckedAt: Date | null) =>
    isVerificationOverdue({ state, lastCheckedAt }, deadline)

  expect(status(ApplicationState.AVAILABLE, old)).toBe(true)
  expect(status(ApplicationState.AVAILABLE, null)).toBe(true)
  expect(status(ApplicationState.AVAILABLE, new Date(deadline))).toBe(false)
  expect(status(ApplicationState.UNAVAILABLE, old)).toBe(false)
  expect(status(ApplicationState.NO_METRICS, old)).toBe(false)
  expect(status(ApplicationState.REMOVED, old)).toBe(false)
})
