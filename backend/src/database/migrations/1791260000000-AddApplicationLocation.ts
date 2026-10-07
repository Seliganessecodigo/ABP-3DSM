import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddApplicationLocation1791260000000 implements MigrationInterface {
  name = 'AddApplicationLocation1791260000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "applications" ADD "regionCode" text`,
    )
    await queryRunner.query(
      `ALTER TABLE "applications" ADD "country" text`,
    )
    await queryRunner.query(
      `ALTER TABLE "applications" ADD "region" text`,
    )
    await queryRunner.query(
      `ALTER TABLE "applications" ADD "city" text`,
    )
    await queryRunner.query(
      `ALTER TABLE "applications" ADD "latitude" double precision`,
    )
    await queryRunner.query(
      `ALTER TABLE "applications" ADD "longitude" double precision`,
    )
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "CK_applications_location_complete" CHECK (
        ("regionCode" IS NULL AND "country" IS NULL AND "region" IS NULL AND "latitude" IS NULL AND "longitude" IS NULL)
        OR
        ("regionCode" IS NOT NULL AND "country" IS NOT NULL AND "region" IS NOT NULL AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL)
      )`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "CK_applications_location_complete"`,
    )
    await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "longitude"`)
    await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "latitude"`)
    await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "city"`)
    await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "region"`)
    await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "country"`)
    await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "regionCode"`)
  }
}
