import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DataSource } from 'typeorm'
import { ApplicationState } from '../../database/entities/application-state'
import { ApplicationEventsRepository } from '../../database/repositories/application-events.repository'
import { ApplicationsRepository } from './applications.repository'
import {
  type ClassifiedStatus,
  classifyStatus,
  type StatusEvidence,
} from './application-status-classifier'

@Injectable()
export class StatusClassificationService {
  constructor(
    private readonly applications: ApplicationsRepository,
    private readonly events: ApplicationEventsRepository,
    private readonly dataSource: DataSource,
  ) {}

  async record(
    applicationId: string,
    evidence: Exclude<StatusEvidence, { kind: 'removal_confirmed' }>,
  ): Promise<ClassifiedStatus> {
    return this.dataSource.transaction(async (manager) => {
      const application = await this.applications.findByIdForUpdate(
        manager,
        applicationId,
      )
      if (!application) {
        throw new NotFoundException({
          code: 'APPLICATION_NOT_FOUND',
          message: 'Aplicação não encontrada',
        })
      }
      if (application.state === ApplicationState.REMOVED) {
        throw new ConflictException({
          code: 'APPLICATION_REMOVED',
          message: 'Aplicação removida exige retorno confirmado no catálogo',
        })
      }

      const status = classifyStatus(
        evidence,
        application.lastObservationAt ?? null,
      )
      await this.applications.updateOperationalStatus(
        manager,
        applicationId,
        status,
      )
      const changed =
        application.state !== status.state ||
        application.stateReason !== status.reason ||
        application.isStale !== status.isStale ||
        application.isCalculable !== status.isCalculable
      if (changed) {
        await this.events.appendInTransaction(manager, {
          applicationId,
          cycleId: null,
          kind: 'status_changed',
          actor: 'system',
          occurredAt: evidence.observedAt,
          details: {
            before: {
              state: application.state,
              reason: application.stateReason,
              isStale: application.isStale,
              isCalculable: application.isCalculable,
            },
            after: {
              state: status.state,
              reason: status.reason,
              isStale: status.isStale,
              isCalculable: status.isCalculable,
            },
          },
        })
      }
      return status
    })
  }
}
