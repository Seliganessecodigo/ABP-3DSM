import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";
import {
  MonitoringIncidentEntity,
  MonitoringIncidentStatus,
} from "../entities/monitoring-incident.entity";

export interface MonitoringIncidentFilters {
  applicationId?: string;
  source?: string;
  integration?: string;
  status?: string;
  page: number;
  limit: number;
}

@Injectable()
export class MonitoringIncidentsRepository {
  constructor(
    @InjectRepository(MonitoringIncidentEntity)
    private readonly repository: Repository<MonitoringIncidentEntity>,
  ) {}

  findActive(
    source: string,
    applicationId: string | null,
    integration: string,
  ): Promise<MonitoringIncidentEntity | null> {
    return this.repository.findOne({
      where: {
        source,
        applicationId: applicationId ?? IsNull(),
        integration: integration as MonitoringIncidentEntity["integration"],
        status: In([
          MonitoringIncidentStatus.OPEN,
          MonitoringIncidentStatus.RECOVERING,
        ]),
      },
      order: { openedAt: "DESC" },
    });
  }

  create(incident: Partial<MonitoringIncidentEntity>) {
    return this.repository.save(this.repository.create(incident));
  }

  save(incident: MonitoringIncidentEntity) {
    return this.repository.save(incident);
  }

  async list(filters: MonitoringIncidentFilters) {
    const query = this.repository.createQueryBuilder("incident");
    if (filters.applicationId)
      query.andWhere("incident.applicationId = :applicationId", {
        applicationId: filters.applicationId,
      });
    if (filters.source)
      query.andWhere("incident.source = :source", { source: filters.source });
    if (filters.integration)
      query.andWhere("incident.integration = :integration", {
        integration: filters.integration,
      });
    if (filters.status)
      query.andWhere("incident.status = :status", { status: filters.status });

    const [items, total] = await query
      .orderBy("incident.openedAt", "DESC")
      .addOrderBy("incident.id", "DESC")
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getManyAndCount();
    return { items, total, page: filters.page, limit: filters.limit };
  }
}
