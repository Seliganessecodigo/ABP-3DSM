import { MigrationInterface, QueryRunner } from 'typeorm'

export class AdminTotpAuthentication1791410000000 implements MigrationInterface {
  name = 'AdminTotpAuthentication1791410000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "recoveryRepresentativeEmail" character varying(320)`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD "totpSecretCiphertext" text`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD "totpKeyVersion" character varying(32)`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD "totpLastUsedStep" bigint`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD "totpPendingCiphertext" text`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD "totpPendingKeyVersion" character varying(32)`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD "totpPendingExpiresAt" TIMESTAMP WITH TIME ZONE`,
    )
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ADD "secondFactorVerifiedAt" TIMESTAMP WITH TIME ZONE`,
    )
    await queryRunner.query(
      `ALTER TABLE "auth_tokens" ADD "attempts" integer NOT NULL DEFAULT 0`,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth_tokens" DROP COLUMN "attempts"`)
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" DROP COLUMN "secondFactorVerifiedAt"`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "totpPendingExpiresAt"`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "totpPendingKeyVersion"`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "totpPendingCiphertext"`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "totpLastUsedStep"`,
    )
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "totpKeyVersion"`)
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "totpSecretCiphertext"`,
    )
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "recoveryRepresentativeEmail"`,
    )
  }
}
