import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { CarbonRegionEntity } from "../database/entities/carbon-region.entity";
import { CarbonRegionsRepository } from "../database/repositories/carbon-regions.repository";
import { CarbonIntensityAdapter } from "./carbon-intensity.adapter";

@Injectable()
export class CarbonFactorService {
  constructor(
    private readonly adapter: CarbonIntensityAdapter,
    private readonly regions: CarbonRegionsRepository,
  ) {}

  async capture(
    regionCode: string,
    signal?: AbortSignal,
  ): Promise<CarbonRegionEntity> {
    const observation = await this.adapter.fetchIntensity(regionCode, signal);
    try {
      return await this.regions.addVersion({
        code: observation.regionCode,
        version: randomUUID(),
        country: observation.country,
        region: observation.region,
        city: observation.city,
        intensity: observation.intensity.toString(),
        unit: observation.unit,
        renewableSharePercent: observation.renewableSharePercent.toString(),
        queriedAt: observation.queriedAt,
        contractVersion: "0.1.0",
        source: null,
        validFrom: null,
        validUntil: null,
      });
    } catch {
      throw new CarbonFactorPersistenceError();
    }
  }
}

export class CarbonFactorPersistenceError extends Error {
  constructor() {
    super("CARBON_FACTOR_PERSISTENCE_FAILED");
  }
}
