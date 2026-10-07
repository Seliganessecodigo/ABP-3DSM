import { createServer, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { CarbonIntensityAdapter } from './carbon-intensity.adapter'

describe('Serviço de intensidade de carbono', () => {
  let server: Server
  afterEach(async () => {
    if (server)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      )
  })

  async function adapterFor(
    status: number,
    body: unknown,
  ): Promise<CarbonIntensityAdapter> {
    server = createServer((request, response) => {
      expect(request.url).toBe('/regions/br-sudeste/carbon-intensity')
      response
        .writeHead(status, { 'content-type': 'application/json' })
        .end(JSON.stringify(body))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    return new CarbonIntensityAdapter(
      `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    )
  }

  it('normaliza fator e unidade documentados, com cidade nula', async () => {
    const adapter = await adapterFor(200, {
      region_code: 'br-sudeste',
      country: 'Brazil',
      region: 'Sudeste',
      city: null,
      carbon_intensity_gco2e_per_kwh: 85,
      renewable_share_percent: 83,
    })
    const before = new Date()
    const factor = await adapter.fetchIntensity('br-sudeste')
    expect(factor).toMatchObject({
      regionCode: 'br-sudeste',
      country: 'Brazil',
      region: 'Sudeste',
      city: null,
      intensity: 85,
      unit: 'gCO2e/kWh',
      renewableSharePercent: 83,
    })
    expect(factor.queriedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(factor.queriedAt.getTime()).toBeLessThanOrEqual(Date.now())
  })

  it('rejeita fator com campo obrigatório ausente', async () => {
    const adapter = await adapterFor(200, {
      region_code: 'br-sudeste',
      country: 'Brazil',
      region: 'Sudeste',
      renewable_share_percent: 83,
    })
    await expect(adapter.fetchIntensity('br-sudeste')).rejects.toMatchObject({
      code: 'INVALID_UPSTREAM_RESPONSE',
    })
  })

  it.each([404, 500])(
    'preserva erro HTTP %i sem criar fator substituto',
    async (status) => {
      const adapter = await adapterFor(status, { error: 'unavailable' })
      await expect(adapter.fetchIntensity('br-sudeste')).rejects.toMatchObject({
        code: 'UPSTREAM_UNAVAILABLE',
        status,
      })
    },
  )
})
