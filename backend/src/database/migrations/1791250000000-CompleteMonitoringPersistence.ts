import { MigrationInterface, QueryRunner } from 'typeorm'

export class CompleteMonitoringPersistence1791250000000 implements MigrationInterface {
  name = 'CompleteMonitoringPersistence1791250000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."monitoring_cycles_status_enum" AS ENUM('RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED')`,
    )
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "collectedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    )
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "metricUnits" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    )
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "carbonRegionVersion" character varying(128)`,
    )
    await queryRunner.query(`ALTER TABLE "collections" ADD "carbonRegionId" uuid`)
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "calculationConfigVersion" character varying(128)`,
    )
    await queryRunner.query(`ALTER TABLE "collections" ADD "calculationConfigId" uuid`)
    await queryRunner.query(
      `CREATE TABLE "monitoring_cycles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "status" "public"."monitoring_cycles_status_enum" NOT NULL DEFAULT 'RUNNING',
        "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "finishedAt" TIMESTAMP WITH TIME ZONE,
        "durationMs" bigint,
        "discoveredCount" integer NOT NULL DEFAULT 0,
        "processedCount" integer NOT NULL DEFAULT 0,
        "failedCount" integer NOT NULL DEFAULT 0,
        "persistedCount" integer NOT NULL DEFAULT 0,
        "details" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_monitoring_cycles_id" PRIMARY KEY ("id"),
        CONSTRAINT "CK_monitoring_cycles_non_negative_counts" CHECK (
          "discoveredCount" >= 0 AND "processedCount" >= 0 AND "failedCount" >= 0 AND "persistedCount" >= 0
        ),
        CONSTRAINT "CK_monitoring_cycles_finished_after_started" CHECK (
          "finishedAt" IS NULL OR "finishedAt" >= "startedAt"
        ),
        CONSTRAINT "CK_monitoring_cycles_duration_non_negative" CHECK (
          "durationMs" IS NULL OR "durationMs" >= 0
        )
      )`,
    )
    await queryRunner.query(
      `CREATE TABLE "carbon_regions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(128) NOT NULL,
        "version" character varying(128) NOT NULL,
        "country" character varying(128),
        "region" character varying(128),
        "city" character varying(128),
        "intensity" numeric(18,8) NOT NULL,
        "unit" character varying(64) NOT NULL,
        "source" character varying(512) NOT NULL,
        "validFrom" TIMESTAMP WITH TIME ZONE NOT NULL,
        "validUntil" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_carbon_regions_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_carbon_regions_code_version" UNIQUE ("code", "version"),
        CONSTRAINT "CK_carbon_regions_non_negative_intensity" CHECK ("intensity" >= 0),
        CONSTRAINT "CK_carbon_regions_validity" CHECK (
          "validUntil" IS NULL OR "validUntil" > "validFrom"
        )
      )`,
    )
    await queryRunner.query(
      `CREATE TABLE "calculation_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying(128) NOT NULL,
        "version" character varying(128) NOT NULL,
        "parameters" jsonb NOT NULL,
        "effectiveFrom" TIMESTAMP WITH TIME ZONE NOT NULL,
        "effectiveUntil" TIMESTAMP WITH TIME ZONE,
        "author" character varying(128) NOT NULL,
        "reason" character varying(512),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_calculation_configs_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_calculation_configs_key_version" UNIQUE ("key", "version"),
        CONSTRAINT "CK_calculation_configs_effective_period" CHECK (
          "effectiveUntil" IS NULL OR "effectiveUntil" > "effectiveFrom"
        )
      )`,
    )
    await queryRunner.query(
      `CREATE TABLE "recalculations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "collectionId" uuid NOT NULL,
        "previousConfigVersion" character varying(128),
        "configVersion" character varying(128) NOT NULL,
        "result" jsonb NOT NULL,
        "requestedBy" character varying(128) NOT NULL,
        "requestedByUserId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recalculations_id" PRIMARY KEY ("id")
      )`,
    )
    await queryRunner.query(
      `CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actor" character varying(128) NOT NULL,
        "actorUserId" uuid,
        "action" character varying(128) NOT NULL,
        "entityType" character varying(128) NOT NULL,
        "entityId" character varying(128) NOT NULL,
        "before" jsonb,
        "after" jsonb,
        "reason" character varying(512),
        "outcome" character varying(64) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      )`,
    )
    await queryRunner.query(
      `ALTER TABLE "collections" ADD CONSTRAINT "FK_collections_carbon_region" FOREIGN KEY ("carbonRegionId") REFERENCES "carbon_regions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "collections" ADD CONSTRAINT "FK_collections_calculation_config" FOREIGN KEY ("calculationConfigId") REFERENCES "calculation_configs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "recalculations" ADD CONSTRAINT "FK_recalculations_collection" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "recalculations" ADD CONSTRAINT "FK_recalculations_user" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_user" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_monitoring_cycles_started_at" ON "monitoring_cycles" ("startedAt")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_carbon_regions_code_validity" ON "carbon_regions" ("code", "validFrom", "validUntil")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_calculation_configs_key_effective" ON "calculation_configs" ("key", "effectiveFrom", "effectiveUntil")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_recalculations_collection_created_at" ON "recalculations" ("collectionId", "createdAt")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_entity_created_at" ON "audit_logs" ("entityType", "entityId", "createdAt")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_actor_created_at" ON "audit_logs" ("actor", "createdAt")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_actor_created_at"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_entity_created_at"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_recalculations_collection_created_at"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_calculation_configs_key_effective"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_carbon_regions_code_validity"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_monitoring_cycles_started_at"`)
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_user"`,
    )
    await queryRunner.query(
      `ALTER TABLE "recalculations" DROP CONSTRAINT "FK_recalculations_user"`,
    )
    await queryRunner.query(
      `ALTER TABLE "recalculations" DROP CONSTRAINT "FK_recalculations_collection"`,
    )
    await queryRunner.query(
      `ALTER TABLE "collections" DROP CONSTRAINT "FK_collections_carbon_region"`,
    )
    await queryRunner.query(
      `ALTER TABLE "collections" DROP CONSTRAINT "FK_collections_calculation_config"`,
    )
    await queryRunner.query(`DROP TABLE "audit_logs"`)
    await queryRunner.query(`DROP TABLE "recalculations"`)
    await queryRunner.query(`DROP TABLE "calculation_configs"`)
    await queryRunner.query(`DROP TABLE "carbon_regions"`)
    await queryRunner.query(`DROP TABLE "monitoring_cycles"`)
    await queryRunner.query(`ALTER TABLE "collections" DROP COLUMN "calculationConfigId"`)
    await queryRunner.query(`ALTER TABLE "collections" DROP COLUMN "calculationConfigVersion"`)
    await queryRunner.query(`ALTER TABLE "collections" DROP COLUMN "carbonRegionId"`)
    await queryRunner.query(`ALTER TABLE "collections" DROP COLUMN "carbonRegionVersion"`)
    await queryRunner.query(`ALTER TABLE "collections" DROP COLUMN "collectedAt"`)
    await queryRunner.query(`ALTER TABLE "collections" DROP COLUMN "metricUnits"`)
    await queryRunner.query(
      `DROP TYPE "public"."monitoring_cycles_status_enum"`,
    )
  }
}
