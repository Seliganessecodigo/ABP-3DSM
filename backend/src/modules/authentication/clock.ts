export const AUTH_CLOCK = Symbol('AUTH_CLOCK')

export interface AuthClock {
  now(): Date
}

export class SystemAuthClock implements AuthClock {
  now(): Date {
    return new Date()
  }
}
