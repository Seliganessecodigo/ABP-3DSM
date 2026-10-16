import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  MonitoringIncidentStatus,
  MonitoringIncidentSource,
  MonitoringIntegration,
} from "../../database/entities/monitoring-incident.entity";

export class MonitoringIncidentDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ enum: MonitoringIncidentSource })
  source!: string;

  @ApiPropertyOptional({ nullable: true, example: "billing-api" })
  applicationId!: string | null;

  @ApiProperty({ enum: MonitoringIntegration })
  integration!: MonitoringIntegration;

  @ApiProperty({ enum: MonitoringIncidentStatus })
  status!: MonitoringIncidentStatus;

  @ApiProperty({ example: "UPSTREAM_UNAVAILABLE" })
  firstReason!: string;

  @ApiProperty({ example: "TIMEOUT" })
  latestReason!: string;

  @ApiProperty({ format: "date-time" })
  firstAttemptAt!: Date;

  @ApiProperty({ format: "date-time" })
  latestAttemptAt!: Date;

  @ApiPropertyOptional({ nullable: true, format: "date-time" })
  lastValidResponseAt!: Date | null;

  @ApiProperty()
  logicalFailureCount!: number;

  @ApiProperty()
  httpAttemptCount!: number;

  @ApiProperty({ format: "date-time" })
  openedAt!: Date;

  @ApiPropertyOptional({ nullable: true, format: "date-time" })
  resolvedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true, format: "uuid" })
  cycleId!: string | null;
}

export class MonitoringIncidentPageDto {
  @ApiProperty({ type: [MonitoringIncidentDto] })
  items!: MonitoringIncidentDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
