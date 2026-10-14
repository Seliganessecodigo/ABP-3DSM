export function getMonitoringScheduleIntervalSeconds(
  environment: NodeJS.ProcessEnv = process.env,
): number {
  const configuredValue = environment.MONITORING_SCHEDULE_INTERVAL_SECONDS
  if (configuredValue === undefined) return 60

  const intervalSeconds = Number(configuredValue)
  if (!Number.isSafeInteger(intervalSeconds) || intervalSeconds <= 0) {
    throw new Error(
      'MONITORING_SCHEDULE_INTERVAL_SECONDS deve ser um inteiro positivo',
    )
  }

  return intervalSeconds
}

export function getMonitoringMetricsConcurrency(
  environment: NodeJS.ProcessEnv = process.env,
): number {
  const configuredValue = environment.MONITORING_METRICS_CONCURRENCY
  if (configuredValue === undefined) return 2
  const concurrency = Number(configuredValue)
  if (!Number.isSafeInteger(concurrency) || concurrency <= 0) {
    throw new Error(
      'MONITORING_METRICS_CONCURRENCY deve ser um inteiro positivo',
    )
  }
  return concurrency
}
