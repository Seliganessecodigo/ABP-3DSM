import { MigrationInterface, QueryRunner } from 'typeorm'

export class MonitoringPauseControl1793500000000 implements MigrationInterface {
  name = 'MonitoringPauseControl1793500000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "monitoring_settings" ("id" character varying(32) NOT NULL DEFAULT 'global', "paused" boolean NOT NULL DEFAULT false, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_monitoring_settings" PRIMARY KEY ("id"))`)
    await queryRunner.query(`INSERT INTO "monitoring_settings" ("id", "paused") VALUES ('global', false)`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "monitoring_settings"`)
  }
}
