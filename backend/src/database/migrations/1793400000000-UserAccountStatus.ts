import { MigrationInterface, QueryRunner } from 'typeorm'

export class UserAccountStatus1793400000000 implements MigrationInterface {
  name = 'UserAccountStatus1793400000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('ACTIVE', 'BLOCKED', 'DEACTIVATED')`)
    await queryRunner.query(`ALTER TABLE "users" ADD "status" "public"."users_status_enum" NOT NULL DEFAULT 'ACTIVE'`)
    await queryRunner.query(`UPDATE "users" SET "status" = CASE WHEN "isActive" THEN 'ACTIVE'::"public"."users_status_enum" ELSE 'DEACTIVATED'::"public"."users_status_enum" END`)
    await queryRunner.query(`UPDATE "auth_sessions" SET "revokedAt" = now() WHERE "revokedAt" IS NULL AND "userId" IN (SELECT "id" FROM "users" WHERE "status" <> 'ACTIVE')`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isActive"`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "isActive" boolean NOT NULL DEFAULT true`)
    await queryRunner.query(`UPDATE "users" SET "isActive" = ("status" = 'ACTIVE')`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`)
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`)
  }
}
