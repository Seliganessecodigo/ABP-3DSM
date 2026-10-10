import { MigrationInterface, QueryRunner } from 'typeorm'

export class ApplicationOperationalStatus1791360000000
  implements MigrationInterface
{
  name = 'ApplicationOperationalStatus1791360000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "applications" ADD "stateReason" character varying(128)',
    )
    await queryRunner.query(
      'ALTER TABLE "applications" ADD "lastObservationAt" TIMESTAMP WITH TIME ZONE',
    )
    await queryRunner.query(
      'ALTER TABLE "applications" ADD "isStale" boolean NOT NULL DEFAULT false',
    )
    await queryRunner.query(
      'ALTER TABLE "applications" ADD "isCalculable" boolean',
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "applications" DROP COLUMN "isCalculable"',
    )
    await queryRunner.query(
      'ALTER TABLE "applications" DROP COLUMN "isStale"',
    )
    await queryRunner.query(
      'ALTER TABLE "applications" DROP COLUMN "lastObservationAt"',
    )
    await queryRunner.query(
      'ALTER TABLE "applications" DROP COLUMN "stateReason"',
    )
  }
}
