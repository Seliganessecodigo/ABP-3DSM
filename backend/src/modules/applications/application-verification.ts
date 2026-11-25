import { getMonitoringScheduleIntervalSeconds } from '../../config/monitoring-schedule.config'
import { ApplicationState } from '../../database/entities/application-state'
import type { ApplicationEntity } from '../../database/entities/application.entity'

export function verificationDeadline(now = Date.now()): number {
  return now - getMonitoringScheduleIntervalSeconds() * 1000
}

export function isVerificationOverdue(
  application: Pick<ApplicationEntity, 'state' | 'lastCheckedAt'>,
  deadline: number,
): boolean {
  return application.state === ApplicationState.AVAILABLE &&
    (application.lastCheckedAt == null || application.lastCheckedAt.getTime() < deadline)
}
