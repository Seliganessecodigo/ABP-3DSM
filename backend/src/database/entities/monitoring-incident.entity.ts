import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

export enum MonitoringIncidentStatus {
  OPEN = "OPEN",
  RECOVERING = "RECOVERING",
  RESOLVED = "RESOLVED",
}

export enum MonitoringIntegration {
  SERVICES = "services",
  METRICS = "metrics",
  CARBON_FACTOR = "carbon-factor",
}

export enum MonitoringIncidentSource {
  METRICS_AGGREGATOR = "metrics-aggregator",
  CARBON_INTENSITY = "carbon-intensity",
}

@Entity({ name: "monitoring_incidents" })
@Index("IDX_monitoring_incidents_opened_at", ["openedAt"])
@Index("IDX_monitoring_incidents_cycle", ["lastCycleId"])
export class MonitoringIncidentEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  source!: string;

  @Column({ type: "text", nullable: true })
  applicationId!: string | null;

  @Column({ type: "enum", enum: MonitoringIntegration })
  integration!: MonitoringIntegration;

  @Column({ type: "enum", enum: MonitoringIncidentStatus })
  status!: MonitoringIncidentStatus;

  @Column({ type: "text" })
  firstReason!: string;

  @Column({ type: "text" })
  latestReason!: string;

  @Column({ type: "integer", default: 0 })
  logicalFailureCount!: number;

  @Column({ type: "integer", default: 0 })
  httpAttemptCount!: number;

  @Column({ type: "integer", default: 0 })
  recoverySuccessCount!: number;

  @Column({ type: "timestamptz" })
  openedAt!: Date;

  @Column({ type: "timestamptz" })
  firstAttemptAt!: Date;

  @Column({ type: "timestamptz" })
  latestAttemptAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  lastValidResponseAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  resolvedAt!: Date | null;

  @Column({ type: "uuid", nullable: true })
  lastCycleId!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
