export type EnvironmentalRankingMetric = "energy" | "emissions";
export type EnvironmentalRankingDirection = "asc" | "desc";

export interface EnvironmentalRankingInput {
  readonly applicationId: string;
  readonly energy: number | null;
  readonly emissions: number | null;
}

export interface EnvironmentalRankingItem {
  readonly applicationId: string;
  readonly rankability: "ranked" | "unranked";
  readonly position: number | null;
  readonly participation: number | null;
}

export interface EnvironmentalRankingResult {
  readonly items: readonly EnvironmentalRankingItem[];
  readonly total: number | null;
  readonly counts: { readonly ranked: number; readonly unranked: number };
}

export function rankEnvironmentalApplications(
  applications: readonly EnvironmentalRankingInput[],
  metric: EnvironmentalRankingMetric,
  direction: EnvironmentalRankingDirection,
): EnvironmentalRankingResult {
  const valueFor = (application: EnvironmentalRankingInput) =>
    application[metric];
  const ranked = applications
    .filter((application) => valueFor(application) !== null)
    .sort((left, right) => {
      const valueDifference = valueFor(left)! - valueFor(right)!;
      return (
        (direction === "asc" ? valueDifference : -valueDifference) ||
        left.applicationId.localeCompare(right.applicationId)
      );
    });
  const total = ranked.reduce(
    (sum, application) => sum + valueFor(application)!,
    0,
  );
  let previousValue: number | null = null;
  let previousPosition = 0;
  const items: EnvironmentalRankingItem[] = ranked.map((application, index) => {
    const value = valueFor(application)!;
    const position = value === previousValue ? previousPosition : index + 1;
    previousValue = value;
    previousPosition = position;
    return {
      applicationId: application.applicationId,
      rankability: "ranked",
      position,
      participation: total > 0 ? value / total : null,
    };
  });

  const unranked = applications
    .filter((application) => valueFor(application) === null)
    .sort((left, right) =>
      left.applicationId.localeCompare(right.applicationId),
    );
  items.push(
    ...unranked.map((application) => ({
      applicationId: application.applicationId,
      rankability: "unranked" as const,
      position: null,
      participation: null,
    })),
  );

  return {
    items,
    total: ranked.length === 0 ? null : total,
    counts: { ranked: ranked.length, unranked: unranked.length },
  };
}
