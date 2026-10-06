import { AppService } from './app.service'

describe('AppService', () => {
  let appService: AppService

  beforeEach(() => {
    appService = new AppService()
  })

  it('returns the API health status and an ISO timestamp', () => {
    const result = appService.getHealth()

    expect(result.service).toBe('GreenER API')
    expect(result.status).toBe('ok')
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false)
  })
})
