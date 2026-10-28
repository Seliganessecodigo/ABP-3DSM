import { MigrationInterface, QueryRunner } from 'typeorm'

export class AuthenticationAndOrganizations1791400000000 implements MigrationInterface {
  name = 'AuthenticationAndOrganizations1791400000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "organizations" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "name" character varying(160) NOT NULL,
      "slug" character varying(80) NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_organizations_id" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_organizations_slug" UNIQUE ("slug")
    )`)
    await queryRunner.query(
      `INSERT INTO "organizations" ("name", "slug") VALUES ('Organização legada', 'legacy')`,
    )
    await queryRunner.query(`ALTER TABLE "users" ADD "organizationId" uuid`)
    await queryRunner.query(
      `UPDATE "users" SET "organizationId" = (SELECT "id" FROM "organizations" WHERE "slug" = 'legacy')`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "organizationId" SET NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD "emailVerifiedAt" TIMESTAMP WITH TIME ZONE`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_email_lower" ON "users" (lower("email"))`,
    )
    await queryRunner.query(`CREATE TABLE "auth_sessions" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "userId" uuid NOT NULL,
      "organizationId" uuid NOT NULL,
      "refreshTokenHash" character(64) NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "lastActivityAt" TIMESTAMP WITH TIME ZONE NOT NULL,
      "absoluteExpiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
      "revokedAt" TIMESTAMP WITH TIME ZONE,
      CONSTRAINT "PK_auth_sessions_id" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_auth_sessions_refresh_hash" UNIQUE ("refreshTokenHash"),
      CONSTRAINT "FK_auth_sessions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
      CONSTRAINT "FK_auth_sessions_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    )`)
    await queryRunner.query(
      `CREATE INDEX "IDX_auth_sessions_user_active" ON "auth_sessions" ("userId", "revokedAt")`,
    )
    await queryRunner.query(`CREATE TABLE "auth_tokens" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "tokenHash" character(64) NOT NULL,
      "kind" character varying(32) NOT NULL,
      "organizationId" uuid NOT NULL,
      "userId" uuid,
      "email" character varying(320) NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
      "consumedAt" TIMESTAMP WITH TIME ZONE,
      "revokedAt" TIMESTAMP WITH TIME ZONE,
      CONSTRAINT "PK_auth_tokens_id" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_auth_tokens_hash" UNIQUE ("tokenHash"),
      CONSTRAINT "FK_auth_tokens_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
      CONSTRAINT "FK_auth_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    )`)
    await queryRunner.query(
      `CREATE INDEX "IDX_auth_tokens_org_kind_created" ON "auth_tokens" ("organizationId", "kind", "createdAt")`,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_auth_tokens_org_kind_created"`)
    await queryRunner.query(`DROP TABLE "auth_tokens"`)
    await queryRunner.query(`DROP INDEX "IDX_auth_sessions_user_active"`)
    await queryRunner.query(`DROP TABLE "auth_sessions"`)
    await queryRunner.query(`DROP INDEX "uq_users_email_lower"`)
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_organization"`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "passwordHash" SET NOT NULL`,
    )
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerifiedAt"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "organizationId"`)
    await queryRunner.query(`DROP TABLE "organizations"`)
  }
}
