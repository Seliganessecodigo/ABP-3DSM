import { MigrationInterface, QueryRunner } from 'typeorm'

export class AuditActorIdentity1793300000000 implements MigrationInterface {
  name = 'AuditActorIdentity1793300000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs"
        ADD "actorType" character varying(32),
        ADD "actorSystemId" character varying(128),
        ADD "actorExternalId" character varying(128),
        ADD "actorLabel" character varying(160)`,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs"
        DROP COLUMN "actorLabel",
        DROP COLUMN "actorExternalId",
        DROP COLUMN "actorSystemId",
        DROP COLUMN "actorType"`,
    )
  }
}
