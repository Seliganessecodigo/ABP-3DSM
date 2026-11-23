import { MigrationInterface, QueryRunner } from 'typeorm'

export class SsoAuthentication1791420000000 implements MigrationInterface {
  name = 'SsoAuthentication1791420000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "external_identities" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "provider" character varying(32) NOT NULL,
      "issuer" character varying(255) NOT NULL,
      "subject" character varying(255) NOT NULL,
      "userId" uuid NOT NULL,
      "organizationId" uuid NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_external_identities_id" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_external_identities_issuer_subject" UNIQUE ("issuer", "subject"),
      CONSTRAINT "UQ_external_identities_user_provider" UNIQUE ("userId", "provider"),
      CONSTRAINT "FK_external_identities_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_external_identities_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
    )`)
    await queryRunner.query(
      `CREATE INDEX "IDX_external_identities_org" ON "external_identities" ("organizationId")`,
    )
    await queryRunner.query(`CREATE TABLE "sso_invitations" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "tokenHash" character(64) NOT NULL,
      "organizationId" uuid NOT NULL,
      "email" character varying(320) NOT NULL,
      "name" character varying(160) NOT NULL,
      "role" "public"."users_role_enum" NOT NULL,
      "createdByUserId" uuid,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
      "consumedAt" TIMESTAMP WITH TIME ZONE,
      "revokedAt" TIMESTAMP WITH TIME ZONE,
      CONSTRAINT "PK_sso_invitations_id" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_sso_invitations_token_hash" UNIQUE ("tokenHash"),
      CONSTRAINT "FK_sso_invitations_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_sso_invitations_creator" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL
    )`)
    await queryRunner.query(
      `CREATE INDEX "IDX_sso_invitations_org_email" ON "sso_invitations" ("organizationId", lower("email"), "createdAt")`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_sso_invitations_one_open_per_email" ON "sso_invitations" ("organizationId", lower("email")) WHERE "consumedAt" IS NULL AND "revokedAt" IS NULL`,
    )
    await queryRunner.query(`CREATE TABLE "sso_transactions" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "stateHash" character(64) NOT NULL,
      "nonce" character varying(128) NOT NULL,
      "googleCodeVerifier" character varying(128) NOT NULL,
      "handoffCodeChallenge" character(43) NOT NULL,
      "invitationTokenHash" character(64),
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
      "consumedAt" TIMESTAMP WITH TIME ZONE,
      CONSTRAINT "PK_sso_transactions_id" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_sso_transactions_state_hash" UNIQUE ("stateHash")
    )`)
    await queryRunner.query(`CREATE TABLE "sso_handoffs" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "codeHash" character(64) NOT NULL,
      "codeChallenge" character(43) NOT NULL,
      "userId" uuid NOT NULL,
      "organizationId" uuid NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
      "consumedAt" TIMESTAMP WITH TIME ZONE,
      CONSTRAINT "PK_sso_handoffs_id" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_sso_handoffs_code_hash" UNIQUE ("codeHash"),
      CONSTRAINT "FK_sso_handoffs_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_sso_handoffs_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
    )`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sso_handoffs"`)
    await queryRunner.query(`DROP TABLE "sso_transactions"`)
    await queryRunner.query(`DROP INDEX "UQ_sso_invitations_one_open_per_email"`)
    await queryRunner.query(`DROP INDEX "IDX_sso_invitations_org_email"`)
    await queryRunner.query(`DROP TABLE "sso_invitations"`)
    await queryRunner.query(`DROP INDEX "IDX_external_identities_org"`)
    await queryRunner.query(`DROP TABLE "external_identities"`)
  }
}
