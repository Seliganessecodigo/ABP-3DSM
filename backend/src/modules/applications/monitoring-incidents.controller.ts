import { Controller, Get, Query } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { MonitoringIncidentFilters } from "../../database/repositories/monitoring-incidents.repository";
import { MonitoringIncidentsService } from "./monitoring-incidents.service";
import { MonitoringIncidentPageDto } from "./monitoring-incident.dto";

@ApiTags("monitoring incidents")
@Controller("monitoring/incidents")
export class MonitoringIncidentsController {
  constructor(private readonly incidents: MonitoringIncidentsService) {}

  @Get()
  @ApiOperation({ summary: "Listar incidentes atuais e encerrados" })
  @ApiQuery({ name: "applicationId", required: false })
  @ApiQuery({ name: "source", required: false })
  @ApiQuery({ name: "integration", required: false })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["OPEN", "RECOVERING", "RESOLVED"],
  })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  @ApiOkResponse({ type: MonitoringIncidentPageDto })
  @ApiBadRequestResponse({ description: "Filtro ou paginação inválida" })
  list(@Query() query: Record<string, string | undefined>) {
    const filters: MonitoringIncidentFilters = {
      applicationId: query.applicationId,
      source: query.source,
      integration: query.integration,
      status: query.status,
      page: parseNumber(query.page, 1),
      limit: parseNumber(query.limit, 20),
    };
    return this.incidents.list(filters);
  }
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value)) return Number.NaN;
  return Number(value);
}
