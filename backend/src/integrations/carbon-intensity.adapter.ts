import { IntegrationError } from "./integration-error";
import { fetchJsonWithRetry } from "./retrying-fetch";

export interface CarbonIntensityObservation {
  regionCode: string;
  country: string;
  region: string;
  city: string | null;
  intensity: number;
  unit: "gCO2e/kWh";
  renewableSharePercent: number;
  queriedAt: Date;
}

export interface CarbonRegionObservation {
  code: string;
  country: string;
  region: string;
  city: string | null;
  latitude: number;
  longitude: number;
  intensity: number;
  unit: "gCO2e/kWh";
  renewableSharePercent: number;
}

export interface CarbonRegionsObservation {
  regions: CarbonRegionObservation[];
  total: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export class CarbonIntensityAdapter {
  constructor(private readonly baseUrl: string) {}

  async fetchRegions(signal?: AbortSignal): Promise<CarbonRegionsObservation> {
    let payload: unknown;
    try {
      payload = await fetchJsonWithRetry(new URL("/regions", this.baseUrl), signal);
    } catch (error) {
      if (error instanceof IntegrationError) throw error;
      throw new IntegrationError("UPSTREAM_UNAVAILABLE");
    }

    if (
      !isRecord(payload) ||
      !Array.isArray(payload.regions) ||
      !Number.isInteger(payload.total) ||
      (payload.total as number) < 0
    ) {
      throw new IntegrationError("INVALID_UPSTREAM_RESPONSE");
    }

    const regions: CarbonRegionObservation[] = [];
    for (const value of payload.regions) {
      if (
        !isRecord(value) ||
        !isNonEmptyString(value.code) ||
        !isNonEmptyString(value.country) ||
        !isNonEmptyString(value.region) ||
        (value.city !== undefined && value.city !== null && typeof value.city !== "string") ||
        !isFiniteNumber(value.latitude) ||
        !isFiniteNumber(value.longitude) ||
        !isFiniteNumber(value.carbon_intensity_gco2e_per_kwh) ||
        !isFiniteNumber(value.renewable_share_percent)
      ) {
        throw new IntegrationError("INVALID_UPSTREAM_RESPONSE");
      }

      regions.push({
        code: value.code,
        country: value.country,
        region: value.region,
        city: value.city ?? null,
        latitude: value.latitude,
        longitude: value.longitude,
        intensity: value.carbon_intensity_gco2e_per_kwh,
        unit: "gCO2e/kWh",
        renewableSharePercent: value.renewable_share_percent,
      });
    }

    return { regions, total: payload.total as number };
  }

  async fetchIntensity(
    regionCode: string,
    signal?: AbortSignal,
  ): Promise<CarbonIntensityObservation> {
    let payload: unknown;
    try {
      payload = await fetchJsonWithRetry(
        new URL(
          `/regions/${encodeURIComponent(regionCode)}/carbon-intensity`,
          this.baseUrl,
        ),
        signal,
      );
    } catch (error) {
      if (error instanceof IntegrationError) throw error;
      throw new IntegrationError("UPSTREAM_UNAVAILABLE");
    }
    if (
      !isRecord(payload) ||
      typeof payload.region_code !== "string" ||
      payload.region_code !== regionCode ||
      typeof payload.country !== "string" ||
      typeof payload.region !== "string" ||
      (payload.city !== undefined &&
        payload.city !== null &&
        typeof payload.city !== "string") ||
      !isFiniteNumber(payload.carbon_intensity_gco2e_per_kwh) ||
      !isFiniteNumber(payload.renewable_share_percent)
    )
      throw new IntegrationError("INVALID_UPSTREAM_RESPONSE");
    return {
      regionCode: payload.region_code,
      country: payload.country,
      region: payload.region,
      city: payload.city ?? null,
      intensity: payload.carbon_intensity_gco2e_per_kwh,
      unit: "gCO2e/kWh",
      renewableSharePercent: payload.renewable_share_percent,
      queriedAt: new Date(),
    };
  }
}
