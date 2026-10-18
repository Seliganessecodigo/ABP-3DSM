import { MigrationInterface, QueryRunner } from 'typeorm'

export class MethodologyMetadata1791380000000 implements MigrationInterface {
  name = 'MethodologyMetadata1791380000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "calculation_configs" ADD "methodology" jsonb',
    )
    await queryRunner.query(
      'ALTER TABLE "collections" ADD "methodologySnapshot" jsonb',
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "collections" DROP COLUMN "methodologySnapshot"',
    )
    await queryRunner.query(
      'ALTER TABLE "calculation_configs" DROP COLUMN "methodology"',
    )
  }
}
