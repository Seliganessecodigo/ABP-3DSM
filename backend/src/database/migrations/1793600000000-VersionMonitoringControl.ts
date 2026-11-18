import { MigrationInterface, QueryRunner } from 'typeorm'

export class VersionMonitoringControl1793600000000 implements MigrationInterface {
  name = 'VersionMonitoringControl1793600000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "monitoring_control_versions" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "paused" boolean NOT NULL,
      "previousVersion" uuid NULL,
      "actorType" varchar(16) NOT NULL,
      "actor" varchar(128) NOT NULL,
      "reason" varchar(512) NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_monitoring_control_versions" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_monitoring_control_previous" UNIQUE ("previousVersion"),
      CONSTRAINT "FK_monitoring_control_previous" FOREIGN KEY ("previousVersion") REFERENCES "monitoring_control_versions"("id") ON DELETE RESTRICT,
      CONSTRAINT "CK_monitoring_control_actor" CHECK ("actorType" IN ('user', 'system'))
    )`)
    await queryRunner.query(`ALTER TABLE "monitoring_settings" ADD "configurationVersion" uuid`)
    // The baseline preserves the deployed state; it does not reconstruct past operations or cycles.
    await queryRunner.query(`WITH baseline AS (
      INSERT INTO "monitoring_control_versions" ("paused", "actorType", "actor", "reason", "createdAt")
      SELECT "paused", 'system', 'migration.monitoring-control', 'Estado preservado na implantação do versionamento', "updatedAt"
      FROM "monitoring_settings" WHERE "id" = 'global' RETURNING "id"
    ) UPDATE "monitoring_settings" SET "configurationVersion" = baseline."id" FROM baseline WHERE "monitoring_settings"."id" = 'global'`)
    await queryRunner.query(`ALTER TABLE "monitoring_settings" ALTER COLUMN "configurationVersion" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "monitoring_settings" ADD CONSTRAINT "FK_monitoring_settings_version" FOREIGN KEY ("configurationVersion") REFERENCES "monitoring_control_versions"("id") ON DELETE RESTRICT`)
    await queryRunner.query(`CREATE FUNCTION preserve_monitoring_control_version() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'Monitoring control versions are immutable'; END;
    $$`)
    await queryRunner.query(`CREATE TRIGGER "TR_monitoring_control_immutable" BEFORE UPDATE OR DELETE ON "monitoring_control_versions" FOR EACH ROW EXECUTE FUNCTION preserve_monitoring_control_version()`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "monitoring_settings" DROP COLUMN "configurationVersion"`)
    await queryRunner.query(`DROP TABLE "monitoring_control_versions"`)
    await queryRunner.query(`DROP FUNCTION preserve_monitoring_control_version()`)
  }
}
