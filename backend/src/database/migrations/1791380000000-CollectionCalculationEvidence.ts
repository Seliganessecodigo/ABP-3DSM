import { MigrationInterface, QueryRunner } from "typeorm";

export class CollectionCalculationEvidence1791380000000
  implements MigrationInterface
{
  name = "CollectionCalculationEvidence1791380000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "calculationEvidence" jsonb`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collections" DROP COLUMN "calculationEvidence"`,
    );
  }
}
