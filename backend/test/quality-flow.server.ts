import * as process from 'node:process'
import { createQualityFixture } from './quality-fixture'

async function main() {
  const fixture = await createQualityFixture(4301, true)
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => { void fixture.close().then(() => process.exit(0)) })
  }
  process.stdout.write(`Quality fixture ready: ${fixture.url}\n`)
}

void main().catch((error: unknown) => { process.stderr.write(`${String(error)}\n`); process.exit(1) })
