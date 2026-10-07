import { MigrationInterface, QueryRunner } from 'typeorm'

export class DiscoverApplications1791350000000 implements MigrationInterface {
  name = 'DiscoverApplications1791350000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "applications" ALTER COLUMN "id" TYPE text`,
    )
    await queryRunner.query(
      `ALTER TABLE "applications" ALTER COLUMN "name" TYPE text`,
    )
    await queryRunner.query(
      `ALTER TABLE "application_events" ALTER COLUMN "applicationId" TYPE text`,
    )
    await queryRunner.query(
      `ALTER TABLE "collections" ALTER COLUMN "applicationId" TYPE text`,
    )
    await queryRunner.query(`ALTER TABLE "applications" ADD "metricsPath" text`)
    await queryRunner.query(
      `ALTER TABLE "application_events" ADD "cycleId" uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "application_events" ADD CONSTRAINT "FK_application_events_cycle" FOREIGN KEY ("cycleId") REFERENCES "monitoring_cycles"("id") ON DELETE RESTRICT`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_application_events_cycle" ON "application_events" ("cycleId")`,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_application_events_cycle"`,
    )
    await queryRunner.query(
      `ALTER TABLE "application_events" DROP CONSTRAINT "FK_application_events_cycle"`,
    )
    await queryRunner.query(
      `ALTER TABLE "application_events" DROP COLUMN "cycleId"`,
    )
    await queryRunner.query(
      `ALTER TABLE "applications" DROP COLUMN "metricsPath"`,
    )
    await queryRunner.query(
      `ALTER TABLE "collections" ALTER COLUMN "applicationId" TYPE character varying(128)`,
    )
    await queryRunner.query(
      `ALTER TABLE "application_events" ALTER COLUMN "applicationId" TYPE character varying(128)`,
    )
    await queryRunner.query(
      `ALTER TABLE "applications" ALTER COLUMN "name" TYPE character varying(255)`,
    )
    await queryRunner.query(
      `ALTER TABLE "applications" ALTER COLUMN "id" TYPE character varying(128)`,
    )
  }
}
