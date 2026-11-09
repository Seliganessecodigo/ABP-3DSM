import { MigrationInterface, QueryRunner } from 'typeorm'

export class PasswordRecovery1793500000000 implements MigrationInterface {
  name = 'PasswordRecovery1793500000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth_sessions" ADD "refreshRevokedAt" TIMESTAMPTZ`)
    await queryRunner.query(`CREATE TABLE "password_recovery_outbox" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "authTokenId" uuid NOT NULL,
      "encryptedPayload" text NOT NULL,
      "keyVersion" character varying(32) NOT NULL,
      "status" character varying(16) NOT NULL DEFAULT 'PENDING',
      "attempts" integer NOT NULL DEFAULT 0,
      "nextAttemptAt" TIMESTAMPTZ NOT NULL,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "PK_password_recovery_outbox" PRIMARY KEY ("id"),
      CONSTRAINT "FK_password_recovery_outbox_token" FOREIGN KEY ("authTokenId") REFERENCES "auth_tokens"("id") ON DELETE CASCADE
    )`)
    await queryRunner.query(`CREATE INDEX "IDX_password_recovery_outbox_due" ON "password_recovery_outbox" ("status", "nextAttemptAt")`)
    await queryRunner.query(`CREATE TABLE "password_recovery_ip_limits" (
      "ipHash" character(64) NOT NULL,
      "windowStartedAt" TIMESTAMPTZ NOT NULL,
      "requestCount" integer NOT NULL,
      CONSTRAINT "PK_password_recovery_ip_limits" PRIMARY KEY ("ipHash")
    )`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "password_recovery_ip_limits"`)
    await queryRunner.query(`DROP TABLE "password_recovery_outbox"`)
    await queryRunner.query(`ALTER TABLE "auth_sessions" DROP COLUMN "refreshRevokedAt"`)
    // PostgreSQL enum values cannot be removed without rebuilding the enum.
  }
}
