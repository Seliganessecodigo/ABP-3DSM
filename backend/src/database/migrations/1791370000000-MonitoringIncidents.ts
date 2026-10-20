import { MigrationInterface, QueryRunner } from "typeorm";

export class MonitoringIncidents1791370000000 implements MigrationInterface {
  name = "MonitoringIncidents1791370000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "monitoring_incidents_integration_enum" AS ENUM('services', 'metrics', 'carbon-factor')`,
    );
    await queryRunner.query(
      `CREATE TYPE "monitoring_incidents_status_enum" AS ENUM('OPEN', 'RECOVERING', 'RESOLVED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "monitoring_incidents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "source" text NOT NULL,
        "applicationId" text,
        "integration" "monitoring_incidents_integration_enum" NOT NULL,
        "status" "monitoring_incidents_status_enum" NOT NULL,
        "firstReason" text NOT NULL,
        "latestReason" text NOT NULL,
        "logicalFailureCount" integer NOT NULL DEFAULT 0,
        "httpAttemptCount" integer NOT NULL DEFAULT 0,
        "recoverySuccessCount" integer NOT NULL DEFAULT 0,
        "openedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "firstAttemptAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "latestAttemptAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "lastValidResponseAt" TIMESTAMP WITH TIME ZONE,
        "resolvedAt" TIMESTAMP WITH TIME ZONE,
        "lastCycleId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_monitoring_incidents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_monitoring_incidents_cycle" FOREIGN KEY ("lastCycleId") REFERENCES "monitoring_cycles"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_monitoring_incidents_opened_at" ON "monitoring_incidents" ("openedAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_monitoring_incidents_cycle" ON "monitoring_incidents" ("lastCycleId")`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_monitoring_incidents_active_global_identity"
      ON "monitoring_incidents" ("source", "integration")
      WHERE "applicationId" IS NULL AND "status" IN ('OPEN', 'RECOVERING')
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_monitoring_incidents_active_application_identity"
      ON "monitoring_incidents" ("source", "applicationId", "integration")
      WHERE "applicationId" IS NOT NULL AND "status" IN ('OPEN', 'RECOVERING')
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_monitoring_incidents_active_application_identity"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_monitoring_incidents_active_global_identity"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_monitoring_incidents_cycle"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_monitoring_incidents_opened_at"`,
    );
    await queryRunner.query(`DROP TABLE "monitoring_incidents"`);
    await queryRunner.query(`DROP TYPE "monitoring_incidents_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "monitoring_incidents_integration_enum"`,
    );
  }
}
