import { UserPreferenceEntity } from "./entities/user-preference.entity";
import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { ApplicationEntity } from "./entities/application.entity";
import { ApplicationEventEntity } from "./entities/application-event.entity";
import { CollectionEntity } from "./entities/collection.entity";
import { UserEntity } from "./entities/user.entity";
import { MonitoringCycleEntity } from "./entities/monitoring-cycle.entity";
import { CarbonRegionEntity } from "./entities/carbon-region.entity";
import { CalculationConfigEntity } from "./entities/calculation-config.entity";
import { RecalculationEntity } from "./entities/recalculation.entity";
import { AuditLogEntity } from "./entities/audit-log.entity";
import { MonitoringIncidentEntity } from "./entities/monitoring-incident.entity";
import { OrganizationEntity } from "./entities/organization.entity";
import { AuthSessionEntity } from "./entities/auth-session.entity";
import { AuthTokenEntity } from "./entities/auth-token.entity";
import { ExternalIdentityEntity } from "./entities/external-identity.entity";
import { SsoHandoffEntity } from "./entities/sso-handoff.entity";
import { SsoInvitationEntity } from "./entities/sso-invitation.entity";
import { SsoTransactionEntity } from "./entities/sso-transaction.entity";

loadEnv({ path: resolve(__dirname, "../../../.env") });

export function typeOrmOptions(): TypeOrmModuleOptions {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL must be configured before starting the API");
  }

  return {
    type: "postgres",
    url,
    entities: [
      UserPreferenceEntity,
      ApplicationEntity,
      ApplicationEventEntity,
      CollectionEntity,
      UserEntity,
      MonitoringCycleEntity,
      CarbonRegionEntity,
      CalculationConfigEntity,
      RecalculationEntity,
      AuditLogEntity,
      MonitoringIncidentEntity,
      OrganizationEntity,
      AuthSessionEntity,
      AuthTokenEntity,
      ExternalIdentityEntity,
      SsoHandoffEntity,
      SsoInvitationEntity,
      SsoTransactionEntity,
    ],
    synchronize: false,
    migrationsRun: false,
    retryAttempts: 10,
    retryDelay: 3000,
    logging:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  };
}
