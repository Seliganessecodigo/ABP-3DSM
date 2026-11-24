import { createServer } from 'node:http'
import { createQualityFixture } from './quality-fixture'

async function main() {
  const fixture = await createQualityFixture(4317)
  const services: { id: string; name: string; metrics_path: string; location: { region_code: string; country: string; region: string; city: null; latitude: number; longitude: number } }[] = []
  fixture.sources.responses.set('/services', { status: 200, body: services })
  await fixture.cycle()
  const control = createServer((request, response) => {
    void (async () => {
      if (request.method === 'POST' && /^\/advance\/(390|1440)$/.test(request.url ?? '')) {
        const width = request.url!.split('/').at(-1)!
        const id = `qa-ui-${width}`
        services.push({ id, name: `QA Nova ${width}`, metrics_path: `/metrics/${id}`,
          location: { region_code: 'br-sudeste', country: 'Brazil', region: 'Sudeste', city: null, latitude: -23.55, longitude: -46.63 } })
        await fixture.cycle()
        response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ id }))
      } else if (request.method === 'POST' && request.url === '/shutdown') {
        await fixture.close()
        response.writeHead(200).end('closed')
        control.close()
      } else response.writeHead(404).end()
    })().catch(error => { console.error(error); response.writeHead(500).end('fixture failed') })
  })
  await new Promise<void>(resolve => control.listen(4318, '127.0.0.1', resolve))
  console.log('QA fixture ready: API 4317 / control 4318')
  process.once('SIGINT', () => { void fixture.close().finally(() => control.close()) })
}
void main().catch(error => { console.error(error); process.exitCode = 1 })
