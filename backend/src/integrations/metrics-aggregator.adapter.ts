import { IntegrationError } from './integration-error'

export interface ServiceLocation {
  regionCode: string
  country: string
  region: string
  city: string | null
  latitude: number
  longitude: number
}

export interface ServiceSummary {
  id: string
  name: string
  location: ServiceLocation
  metricsPath: string
}

export interface MetricsObservation {
  collectionIntervalSeconds: number
  metrics: {
    cpuPercent: number
    memoryGb: number
    diskGb: number
    networkGb: number
  }
  receivedAt: Date
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parseService(value: unknown): ServiceSummary {
  if (!isRecord(value) || !isRecord(value.location)) {
    throw new IntegrationError('INVALID_UPSTREAM_RESPONSE')
  }

  const { location } = value
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.metrics_path !== 'string' ||
    typeof location.region_code !== 'string' ||
    typeof location.country !== 'string' ||
    typeof location.region !== 'string' ||
    !isFiniteNumber(location.latitude) ||
    !isFiniteNumber(location.longitude) ||
    (location.city !== undefined &&
      location.city !== null &&
      typeof location.city !== 'string')
  ) {
    throw new IntegrationError('INVALID_UPSTREAM_RESPONSE')
  }

  return {
    id: value.id,
    name: value.name,
    location: {
      regionCode: location.region_code,
      country: location.country,
      region: location.region,
      city: location.city ?? null,
      latitude: location.latitude,
      longitude: location.longitude,
    },
    metricsPath: value.metrics_path,
  }
}

function parseMetrics(value: unknown): MetricsObservation {
  if (!isRecord(value) || !isRecord(value.metrics)) {
    throw new IntegrationError('INVALID_UPSTREAM_RESPONSE')
  }
  const { metrics } = value
  if (
    !Number.isSafeInteger(value.collection_interval_seconds) ||
    (value.collection_interval_seconds as number) < 0 ||
    !isFiniteNumber(metrics.cpu_percent) ||
    metrics.cpu_percent < 0 ||
    metrics.cpu_percent > 100 ||
    !isFiniteNumber(metrics.memory_gb) ||
    !isFiniteNumber(metrics.disk_gb) ||
    !isFiniteNumber(metrics.network_gb)
  ) {
    throw new IntegrationError('INVALID_UPSTREAM_RESPONSE')
  }
  return {
    collectionIntervalSeconds: value.collection_interval_seconds as number,
    metrics: {
      cpuPercent: metrics.cpu_percent,
      memoryGb: metrics.memory_gb,
      diskGb: metrics.disk_gb,
      networkGb: metrics.network_gb,
    },
    receivedAt: new Date(),
  }
}

export class MetricsAggregatorAdapter {
  constructor(private readonly baseUrl: string) {}

  async fetchServices(): Promise<ServiceSummary[]> {
    const services = await this.getJson('/services')
    if (!Array.isArray(services)) {
      throw new IntegrationError('INVALID_UPSTREAM_RESPONSE')
    }
    return services.map(parseService)
  }

  async fetchMetrics(serviceId: string): Promise<MetricsObservation> {
    return parseMetrics(
      await this.getJson(`/metrics/${encodeURIComponent(serviceId)}`),
    )
  }

  private async getJson(path: string): Promise<unknown> {
    let response: Response
    try {
      response = await fetch(new URL(path, this.baseUrl))
    } catch {
      throw new IntegrationError('UPSTREAM_UNAVAILABLE')
    }
    if (!response.ok) {
      throw new IntegrationError('UPSTREAM_UNAVAILABLE', response.status)
    }
    try {
      return await response.json()
    } catch {
      throw new IntegrationError('INVALID_UPSTREAM_RESPONSE')
    }
  }
}
