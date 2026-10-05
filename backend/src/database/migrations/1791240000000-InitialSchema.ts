import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1791240000000 implements MigrationInterface {
  name = 'InitialSchema1791240000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    await queryRunner.query(
      `CREATE TYPE "public"."applications_state_enum" AS ENUM('AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED')`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."collections_state_enum" AS ENUM('AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED')`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'ANALYST', 'VISITOR')`,
    )
    await queryRunner.query(
      `CREATE TABLE "applications" (
        "id" character varying(128) NOT NULL,
        "name" character varying(255) NOT NULL,
        "location" character varying(255),
        "state" "public"."applications_state_enum" NOT NULL DEFAULT 'AVAILABLE',
        "firstSeenAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "lastCheckedAt" TIMESTAMP WITH TIME ZONE,
        "removedAt" TIMESTAMP WITH TIME ZONE,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_applications_id" PRIMARY KEY ("id")
      )`,
    )
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(160) NOT NULL,
        "email" character varying(320) NOT NULL,
        "passwordHash" character varying(255) NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'VISITOR',
        "isActive" boolean NOT NULL DEFAULT true,
        "lastAccessAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_users_email" UNIQUE ("email")
      )`,
    )
    await queryRunner.query(
      `CREATE TABLE "application_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "applicationId" character varying(128) NOT NULL,
        "kind" character varying(64) NOT NULL,
        "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "actor" character varying(128) NOT NULL,
        "details" jsonb,
        CONSTRAINT "PK_application_events_id" PRIMARY KEY ("id")
      )`,
    )
    await queryRunner.query(
      `CREATE TABLE "collections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "applicationId" character varying(128) NOT NULL,
        "intervalStart" TIMESTAMP WITH TIME ZONE NOT NULL,
        "intervalEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
        "metrics" jsonb NOT NULL,
        "state" "public"."collections_state_enum" NOT NULL,
        "reason" character varying(128),
        "energyKwh" numeric(18,8),
        "carbonGrams" numeric(18,8),
        "carbonFactor" numeric(18,8),
        "calculationVersion" character varying(64),
        "coverage" numeric(7,4),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_collections_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_collections_application_interval_start" UNIQUE ("applicationId", "intervalStart")
      )`,
    )
    await queryRunner.query(
      `ALTER TABLE "application_events" ADD CONSTRAINT "FK_application_events_application" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "collections" ADD CONSTRAINT "FK_collections_application" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_application_events_application_occurred_at" ON "application_events" ("applicationId", "occurredAt")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_collections_interval" ON "collections" ("intervalStart", "intervalEnd")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_collections_interval"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_application_events_application_occurred_at"`,
    )
    await queryRunner.query(
      `ALTER TABLE "collections" DROP CONSTRAINT "FK_collections_application"`,
    )
    await queryRunner.query(
      `ALTER TABLE "application_events" DROP CONSTRAINT "FK_application_events_application"`,
    )
    await queryRunner.query(`DROP TABLE "collections"`)
    await queryRunner.query(`DROP TABLE "application_events"`)
    await queryRunner.query(`DROP TABLE "users"`)
    await queryRunner.query(`DROP TABLE "applications"`)
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`)
    await queryRunner.query(`DROP TYPE "public"."collections_state_enum"`)
    await queryRunner.query(`DROP TYPE "public"."applications_state_enum"`)
  }
}
