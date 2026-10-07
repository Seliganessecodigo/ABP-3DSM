import { MigrationInterface, QueryRunner } from 'typeorm'

export class CarbonFactorSnapshots1791340000000 implements MigrationInterface {
  name = 'CarbonFactorSnapshots1791340000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "carbon_regions" ALTER COLUMN "source" DROP NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "carbon_regions" ALTER COLUMN "validFrom" DROP NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "carbon_regions" ADD "queriedAt" TIMESTAMP WITH TIME ZONE`,
    )
    await queryRunner.query(
      `ALTER TABLE "carbon_regions" ADD "contractVersion" character varying(32)`,
    )
    await queryRunner.query(
      `ALTER TABLE "carbon_regions" ADD "renewableSharePercent" numeric(7,4)`,
    )
    await queryRunner.query(
      `ALTER TABLE "carbon_regions" ADD CONSTRAINT "CK_carbon_regions_snapshot_metadata" CHECK (("queriedAt" IS NULL AND "contractVersion" IS NULL) OR ("queriedAt" IS NOT NULL AND "contractVersion" IS NOT NULL))`,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "carbon_regions" DROP CONSTRAINT "CK_carbon_regions_snapshot_metadata"`,
    )
    await queryRunner.query(
      `ALTER TABLE "carbon_regions" DROP COLUMN "renewableSharePercent"`,
    )
    await queryRunner.query(
      `ALTER TABLE "carbon_regions" DROP COLUMN "contractVersion"`,
    )
    await queryRunner.query(
      `ALTER TABLE "carbon_regions" DROP COLUMN "queriedAt"`,
    )
    await queryRunner.query(
      `ALTER TABLE "carbon_regions" ALTER COLUMN "validFrom" SET NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "carbon_regions" ALTER COLUMN "source" SET NOT NULL`,
    )
  }
}
