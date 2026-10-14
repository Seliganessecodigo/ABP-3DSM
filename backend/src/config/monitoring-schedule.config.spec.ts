import {
  getMonitoringMetricsConcurrency,
  getMonitoringScheduleIntervalSeconds,
} from './monitoring-schedule.config'

describe('cadência do agendador de monitoramento', () => {
  it('usa 60 segundos quando nenhuma configuração foi informada', () => {
    expect(getMonitoringScheduleIntervalSeconds({})).toBe(60)
  })

  it('usa o intervalo positivo definido no ambiente', () => {
    expect(
      getMonitoringScheduleIntervalSeconds({
        MONITORING_SCHEDULE_INTERVAL_SECONDS: '120',
      }),
    ).toBe(120)
  })

  it('rejeita um intervalo de zero segundos', () => {
    expect(() =>
      getMonitoringScheduleIntervalSeconds({
        MONITORING_SCHEDULE_INTERVAL_SECONDS: '0',
      }),
    ).toThrow(
      'MONITORING_SCHEDULE_INTERVAL_SECONDS deve ser um inteiro positivo',
    )
  })

  it('usa limite inicial configurável de duas métricas simultâneas', () => {
    expect(getMonitoringMetricsConcurrency({})).toBe(2)
    expect(
      getMonitoringMetricsConcurrency({ MONITORING_METRICS_CONCURRENCY: '4' }),
    ).toBe(4)
  })

  it('rejeita limite inválido de chamadas simultâneas', () => {
    expect(() =>
      getMonitoringMetricsConcurrency({ MONITORING_METRICS_CONCURRENCY: '0' }),
    ).toThrow('MONITORING_METRICS_CONCURRENCY')
  })
})
