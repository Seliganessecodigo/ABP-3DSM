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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class CarbonIntensityAdapter {
  constructor(private readonly baseUrl: string) {}

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
      typeof payload.carbon_intensity_gco2e_per_kwh !== "number" ||
      !Number.isFinite(payload.carbon_intensity_gco2e_per_kwh) ||
      typeof payload.renewable_share_percent !== "number" ||
      !Number.isFinite(payload.renewable_share_percent)
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
