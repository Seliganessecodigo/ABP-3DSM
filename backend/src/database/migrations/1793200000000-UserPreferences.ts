import { MigrationInterface, QueryRunner } from 'typeorm'

export class UserPreferences1793200000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "user_preferences" (
      "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "tab" varchar NOT NULL CHECK ("tab" IN ('energy', 'emissions', 'coverage', 'analysis')),
      "value" jsonb NOT NULL,
      "revision" integer NOT NULL CHECK ("revision" > 0),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY ("userId", "tab")
    )`)
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "user_preferences"')
  }
}
