import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApplicationEntity } from "../../database/entities/application.entity";
import { ApplicationState } from "../../database/entities/application-state";
import { ApplicationStateReason } from "../../database/entities/application-state-reason";
import { ApplicationsRepository } from "./applications.repository";
import {
  EnvironmentalAnalysisSummaryFilters,
  EnvironmentalAnalysisSummaryService,
} from "./environmental-analysis-summary.service";
import { EnvironmentalAnalysisSummaryApplicationDto } from "./environmental-analysis-summary.dto";
import {
  EnvironmentalAnalysisRankingDto,
  EnvironmentalAnalysisRankingItemDto,
} from "./environmental-analysis-ranking.dto";
import {
  EnvironmentalRankingDirection,
  EnvironmentalRankingMetric,
  rankEnvironmentalApplications,
} from "./environmental-ranking";

type RawQuery = Readonly<Record<string, string | string[] | undefined>>;
type RankingRow = EnvironmentalAnalysisRankingItemDto;

const states = Object.values(ApplicationState);
const stateReasons = Object.values(ApplicationStateReason);
const sortFields = [
  "applicationId",
  "name",
  "state",
  "stateReason",
  "regionCode",
  "country",
  "region",
  "city",
  "energy",
  "emissions",
  "energyCoverage",
  "emissionsCoverage",
  "rankability",
  "position",
  "participation",
] as const;
type SortField = (typeof sortFields)[number];
const textFields = [
  "applicationId",
  "name",
  "stateReason",
  "regionCode",
  "country",
  "region",
  "city",
] as const;
type TextField = (typeof textFields)[number];
const numericFields = [
  "energy",
  "emissions",
  "energyCoverage",
  "emissionsCoverage",
  "position",
  "participation",
] as const;
type NumericField = (typeof numericFields)[number];

@Injectable()
export class EnvironmentalAnalysisRankingService {
  constructor(
    private readonly summary: EnvironmentalAnalysisSummaryService,
    private readonly applications: ApplicationsRepository,
  ) {}

  async getRanking(query: RawQuery): Promise<EnvironmentalAnalysisRankingDto> {
    const metric = requiredChoice(
      query.metric,
      ["energy", "emissions"],
      "INVALID_ANALYSIS_RANKING_METRIC",
    ) as EnvironmentalRankingMetric;
    const direction = requiredChoice(
      query.direction,
      ["asc", "desc"],
      "INVALID_ANALYSIS_RANKING_DIRECTION",
    ) as EnvironmentalRankingDirection;
    const filters: EnvironmentalAnalysisSummaryFilters = {
      from: scalar(query.from),
      to: scalar(query.to),
      states: query.states,
      regionCodes: query.regionCodes,
      applicationIds: query.applicationIds,
    };
    let source: Awaited<
      ReturnType<EnvironmentalAnalysisSummaryService["getSummaryForRanking"]>
    >;
    let allApplications: ApplicationEntity[];
    try {
      const result = await Promise.all([
        this.summary.getSummaryForRanking(filters),
        this.applications.findAll(),
      ]);
      source = result[0];
      allApplications = result[1];
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new ServiceUnavailableException({
        code: "ANALYSIS_RANKING_UNAVAILABLE",
      });
    }
    const applicationById = new Map(
      allApplications.map((application) => [application.id, application]),
    );
    const scoped = source.applications.map((application) => {
      const metadata = applicationById.get(application.applicationId);
      return toRankingRow(application, metadata);
    });
    const ranked = rankEnvironmentalApplications(
      scoped.map(({ applicationId, energy, emissions }) => ({
        applicationId,
        energy: energy.value,
        emissions: emissions.value,
      })),
      metric,
      direction,
    );
    const rowById = new Map(scoped.map((row) => [row.applicationId, row]));
    const fullRows = ranked.items.map((rank) => ({
      ...rowById.get(rank.applicationId)!,
      ...rank,
    }));
    const presentationRows = applyPresentationFilters(fullRows, query);
    const presentationCounts = countRankability(presentationRows);
    const sortedRows = sortPresentation(presentationRows, query);
    const page = integerQuery(query.page, 1, "INVALID_ANALYSIS_RANKING_PAGE");
    const pageSizeValue = scalar(query.pageSize) ?? "10";
    const pageSize = parsePageSize(pageSizeValue);
    if (pageSize === "all" && page !== 1) {
      throw new BadRequestException({
        code: "INVALID_ANALYSIS_RANKING_PAGINATION",
      });
    }
    const totalItems = sortedRows.length;
    const totalPages =
      pageSize === "all" || totalItems === 0
        ? totalItems === 0
          ? 0
          : 1
        : Math.ceil(totalItems / pageSize);
    const effectivePage =
      pageSize === "all" || totalPages === 0 ? 1 : Math.min(page, totalPages);
    const items =
      pageSize === "all"
        ? sortedRows
        : sortedRows.slice(
            (effectivePage - 1) * pageSize,
            effectivePage * pageSize,
          );
    const selectedTotal =
      metric === "energy"
        ? source.totals.energy.value
        : source.totals.emissions.value;
    return {
      status: selectedTotal === null ? "empty" : "available",
      metric,
      direction,
      period: source.period,
      scope: {
        applicationCount: scoped.length,
        rankedCount: ranked.counts.ranked,
        unrankedCount: ranked.counts.unranked,
        energy: source.totals.energy,
        emissions: source.totals.emissions,
        coverage: source.coverage,
      },
      presentation: presentationCounts,
      pagination: { page: effectivePage, pageSize, totalItems, totalPages },
      items,
    };
  }
}

function toRankingRow(
  source: EnvironmentalAnalysisSummaryApplicationDto,
  metadata: ApplicationEntity | undefined,
): RankingRow {
  const noObservations =
    source.energy.value === null &&
    source.emissions.value === null &&
    source.coverage.energy === 0 &&
    source.coverage.emissions === 0 &&
    source.energy.reasons.length === 0 &&
    source.emissions.reasons.length === 0;
  return {
    applicationId: source.applicationId,
    name: source.name,
    state: source.state,
    stateReason: metadata?.stateReason ?? null,
    location: {
      regionCode: metadata?.regionCode ?? null,
      country: metadata?.country ?? null,
      region: metadata?.region ?? null,
      city: metadata?.city ?? null,
    },
    energy: noObservations
      ? { ...source.energy, reasons: [{ code: "NO_OBSERVATION" }] }
      : source.energy,
    emissions: noObservations
      ? { ...source.emissions, reasons: [{ code: "NO_OBSERVATION" }] }
      : source.emissions,
    coverage: source.coverage,
    rankability: "unranked",
    position: null,
    participation: null,
  };
}

function applyPresentationFilters(
  rows: readonly RankingRow[],
  query: RawQuery,
): RankingRow[] {
  const search = scalar(query.search);
  const normalizedSearch =
    search === undefined ? undefined : normalizeText(search);
  const textFilter: Partial<Record<TextField, string>> = {
    applicationId: scalar(query.filterApplicationId),
    name: scalar(query.filterName),
    stateReason: scalar(query.filterStateReason),
    regionCode: scalar(query.filterRegionCode),
    country: scalar(query.filterCountry),
    region: scalar(query.filterRegion),
    city: scalar(query.filterCity),
  };
  const stateFilter = scalar(query.filterState);
  if (
    stateFilter !== undefined &&
    !states.includes(stateFilter as ApplicationState)
  ) {
    throw new BadRequestException({
      code: "INVALID_ANALYSIS_RANKING_STATE_FILTER",
    });
  }
  const rankabilityFilter = scalar(query.filterRankability);
  if (
    rankabilityFilter !== undefined &&
    !["ranked", "unranked"].includes(rankabilityFilter)
  ) {
    throw new BadRequestException({ code: "INVALID_ANALYSIS_RANKING_FILTER" });
  }
  const stateReasonFilter = scalar(query.filterStateReason);
  if (
    stateReasonFilter !== undefined &&
    !stateReasons.includes(stateReasonFilter as ApplicationStateReason)
  ) {
    throw new BadRequestException({
      code: "INVALID_ANALYSIS_RANKING_STATE_REASON_FILTER",
    });
  }
  const energyReasonFilter = scalar(query.filterEnergyReason);
  const emissionsReasonFilter = scalar(query.filterEmissionsReason);
  const numericFilters = new Map<
    NumericField,
    { min?: number; max?: number; missing?: boolean }
  >();
  for (const field of numericFields) {
    const min = numericQuery(query[`${field}Min`], field, "min");
    const max = numericQuery(query[`${field}Max`], field, "max");
    const missingValue = scalar(query[`${field}Missing`]);
    if (
      missingValue !== undefined &&
      missingValue !== "true" &&
      missingValue !== "false"
    ) {
      throw new BadRequestException({
        code: "INVALID_ANALYSIS_RANKING_FILTER",
      });
    }
    if (min !== undefined && max !== undefined && min > max) {
      throw new BadRequestException({
        code: "INVALID_ANALYSIS_RANKING_FILTER",
      });
    }
    if (missingValue === "true" && (min !== undefined || max !== undefined)) {
      throw new BadRequestException({
        code: "INVALID_ANALYSIS_RANKING_FILTER",
      });
    }
    if (min !== undefined || max !== undefined || missingValue !== undefined) {
      numericFilters.set(field, {
        min,
        max,
        missing:
          missingValue === "true"
            ? true
            : missingValue === "false"
              ? false
              : undefined,
      });
    }
  }
  return rows.filter((row) => {
    if (
      normalizedSearch !== undefined &&
      !searchableValues(row).some((value) =>
        normalizeText(value).includes(normalizedSearch),
      )
    )
      return false;
    if (stateFilter !== undefined && row.state !== stateFilter) return false;
    if (
      stateReasonFilter !== undefined &&
      row.stateReason !== stateReasonFilter
    )
      return false;
    if (
      rankabilityFilter !== undefined &&
      row.rankability !== rankabilityFilter
    )
      return false;
    if (
      energyReasonFilter !== undefined &&
      !row.energy.reasons.some(({ code }) => code === energyReasonFilter)
    )
      return false;
    if (
      emissionsReasonFilter !== undefined &&
      !row.emissions.reasons.some(({ code }) => code === emissionsReasonFilter)
    )
      return false;
    for (const field of textFields) {
      const expected = textFilter[field];
      if (
        expected !== undefined &&
        !normalizeText(String(getRowValue(row, field) ?? "")).includes(
          normalizeText(expected),
        )
      )
        return false;
    }
    for (const [field, filter] of numericFilters) {
      const value = numericValue(row, field);
      if (filter.missing !== undefined && (value === null) !== filter.missing)
        return false;
      if (
        value === null &&
        (filter.min !== undefined || filter.max !== undefined)
      )
        return false;
      if (value !== null && filter.min !== undefined && value < filter.min)
        return false;
      if (value !== null && filter.max !== undefined && value > filter.max)
        return false;
    }
    return true;
  });
}

function searchableValues(row: RankingRow): string[] {
  return [
    row.applicationId,
    row.name,
    row.state,
    row.stateReason ?? "",
    row.location.regionCode ?? "",
    row.location.country ?? "",
    row.location.region ?? "",
    row.location.city ?? "",
    row.energy.unit,
    row.emissions.unit,
    row.energy.value === null ? "" : String(row.energy.value),
    ...row.energy.reasons.map(({ code, metric }) => `${code} ${metric ?? ""}`),
    row.emissions.value === null ? "" : String(row.emissions.value),
    ...row.emissions.reasons.map(
      ({ code, metric }) => `${code} ${metric ?? ""}`,
    ),
    String(row.coverage.energy),
    String(row.coverage.emissions),
    row.rankability,
    row.position === null ? "" : String(row.position),
    row.participation === null ? "" : String(row.participation),
  ];
}

function sortPresentation(
  rows: readonly RankingRow[],
  query: RawQuery,
): RankingRow[] {
  const sortByValue = scalar(query.sortBy);
  const sortDirectionValue = scalar(query.sortDirection);
  if (sortByValue === undefined && sortDirectionValue === undefined)
    return [...rows];
  if (
    sortByValue === undefined ||
    sortDirectionValue === undefined ||
    !sortFields.includes(sortByValue as SortField) ||
    !["asc", "desc"].includes(sortDirectionValue)
  )
    throw new BadRequestException({ code: "INVALID_ANALYSIS_RANKING_SORT" });
  const field = sortByValue as SortField;
  const displayDirection = sortDirectionValue as EnvironmentalRankingDirection;
  const rowValue = (row: RankingRow): string | number | null => {
    switch (field) {
      case "applicationId":
        return row.applicationId;
      case "name":
        return row.name;
      case "state":
        return row.state;
      case "stateReason":
        return row.stateReason;
      case "regionCode":
        return row.location.regionCode;
      case "country":
        return row.location.country;
      case "region":
        return row.location.region;
      case "city":
        return row.location.city;
      case "energy":
        return row.energy.value;
      case "emissions":
        return row.emissions.value;
      case "energyCoverage":
        return row.coverage.energy;
      case "emissionsCoverage":
        return row.coverage.emissions;
      case "rankability":
        return row.rankability;
      case "position":
        return row.position;
      case "participation":
        return row.participation;
    }
  };
  return [...rows].sort((left, right) => {
    if (left.rankability !== right.rankability)
      return left.rankability === "ranked" ? -1 : 1;
    const leftValue = rowValue(left);
    const rightValue = rowValue(right);
    if (leftValue === null || rightValue === null) {
      if (leftValue === rightValue)
        return left.applicationId.localeCompare(right.applicationId);
      return leftValue === null ? 1 : -1;
    }
    const comparison =
      typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));
    return (
      (displayDirection === "asc" ? comparison : -comparison) ||
      left.applicationId.localeCompare(right.applicationId)
    );
  });
}

function numericValue(row: RankingRow, field: NumericField): number | null {
  switch (field) {
    case "energy":
      return row.energy.value;
    case "emissions":
      return row.emissions.value;
    case "energyCoverage":
      return row.coverage.energy;
    case "emissionsCoverage":
      return row.coverage.emissions;
    case "position":
      return row.position;
    case "participation":
      return row.participation;
  }
}

function getRowValue(row: RankingRow, field: TextField): string | null {
  switch (field) {
    case "applicationId":
      return row.applicationId;
    case "name":
      return row.name;
    case "stateReason":
      return row.stateReason;
    case "regionCode":
      return row.location.regionCode;
    case "country":
      return row.location.country;
    case "region":
      return row.location.region;
    case "city":
      return row.location.city;
  }
}

function countRankability(rows: readonly RankingRow[]) {
  return rows.reduce(
    (counts, row) => {
      counts[row.rankability === "ranked" ? "rankedCount" : "unrankedCount"] +=
        1;
      return counts;
    },
    { rankedCount: 0, unrankedCount: 0 },
  );
}

function requiredChoice<T extends string>(
  value: string | string[] | undefined,
  choices: readonly T[],
  code: string,
): T {
  const actual = scalar(value);
  if (actual === undefined || !choices.includes(actual as T))
    throw new BadRequestException({ code });
  return actual as T;
}

function scalar(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string")
    throw new BadRequestException({ code: "INVALID_ANALYSIS_RANKING_QUERY" });
  return value;
}

function integerQuery(
  value: string | string[] | undefined,
  fallback: number,
  code: string,
): number {
  const actual = scalar(value);
  if (actual === undefined) return fallback;
  if (!/^[1-9]\d*$/.test(actual)) throw new BadRequestException({ code });
  return Number(actual);
}

function numericQuery(
  value: string | string[] | undefined,
  field: NumericField,
  bound: "min" | "max",
): number | undefined {
  const actual = scalar(value);
  if (actual === undefined) return undefined;
  const numeric = Number(actual);
  const lowerBound = field === "position" ? 1 : 0;
  const upperBound = [
    "energyCoverage",
    "emissionsCoverage",
    "participation",
  ].includes(field)
    ? 1
    : Number.POSITIVE_INFINITY;
  if (
    !Number.isFinite(numeric) ||
    numeric < lowerBound ||
    numeric > upperBound ||
    (field === "position" && !Number.isInteger(numeric))
  )
    throw new BadRequestException({
      code: `INVALID_ANALYSIS_RANKING_${field.toUpperCase()}_${bound.toUpperCase()}`,
    });
  return numeric;
}

function parsePageSize(value: string): number | "all" {
  if (value === "all") return value;
  if (!["5", "10", "15", "20"].includes(value))
    throw new BadRequestException({
      code: "INVALID_ANALYSIS_RANKING_PAGE_SIZE",
    });
  return Number(value);
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
