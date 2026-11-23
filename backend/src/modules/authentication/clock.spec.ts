import { SystemAuthClock } from './clock'

describe('SystemAuthClock', () => {
  it('returns the current time as a Date', () => {
    const before = Date.now()

    const now = new SystemAuthClock().now()

    expect(now).toBeInstanceOf(Date)
    expect(now.getTime()).toBeGreaterThanOrEqual(before)
    expect(now.getTime()).toBeLessThanOrEqual(Date.now())
  })
})
