import { rankEnvironmentalApplications } from "./environmental-ranking";

describe("rankEnvironmentalApplications", () => {
  it("assigns competitive positions and participation from available values", () => {
    const result = rankEnvironmentalApplications(
      [
        { applicationId: "app-c", energy: 2, emissions: 20 },
        { applicationId: "app-a", energy: 4, emissions: 40 },
        { applicationId: "app-b", energy: 4, emissions: 10 },
        { applicationId: "app-d", energy: null, emissions: 5 },
      ],
      "energy",
      "desc",
    );

    expect(result.items).toEqual([
      {
        applicationId: "app-a",
        rankability: "ranked",
        position: 1,
        participation: 0.4,
      },
      {
        applicationId: "app-b",
        rankability: "ranked",
        position: 1,
        participation: 0.4,
      },
      {
        applicationId: "app-c",
        rankability: "ranked",
        position: 3,
        participation: 0.2,
      },
      {
        applicationId: "app-d",
        rankability: "unranked",
        position: null,
        participation: null,
      },
    ]);
    expect(result.counts).toEqual({ ranked: 3, unranked: 1 });
    expect(result.total).toBe(10);
  });

  it("keeps zero as a ranked value and uses null participation when the total is zero", () => {
    const result = rankEnvironmentalApplications(
      [
        { applicationId: "app-b", energy: 0, emissions: null },
        { applicationId: "app-a", energy: 0, emissions: null },
      ],
      "energy",
      "asc",
    );

    expect(result.items).toEqual([
      {
        applicationId: "app-a",
        rankability: "ranked",
        position: 1,
        participation: null,
      },
      {
        applicationId: "app-b",
        rankability: "ranked",
        position: 1,
        participation: null,
      },
    ]);
    expect(result.total).toBe(0);
    expect(result.counts).toEqual({ ranked: 2, unranked: 0 });
  });

  it("ranks by the selected emissions measure and keeps missing values unranked", () => {
    const result = rankEnvironmentalApplications(
      [
        { applicationId: "app-a", energy: 100, emissions: 5 },
        { applicationId: "app-b", energy: 1, emissions: 2 },
        { applicationId: "app-c", energy: 0, emissions: null },
      ],
      "emissions",
      "asc",
    );

    expect(result).toEqual({
      items: [
        {
          applicationId: "app-b",
          rankability: "ranked",
          position: 1,
          participation: 2 / 7,
        },
        {
          applicationId: "app-a",
          rankability: "ranked",
          position: 2,
          participation: 5 / 7,
        },
        {
          applicationId: "app-c",
          rankability: "unranked",
          position: null,
          participation: null,
        },
      ],
      total: 7,
      counts: { ranked: 2, unranked: 1 },
    });
  });

  it("returns an empty result when no applications belong to the domain-filtered scope", () => {
    expect(rankEnvironmentalApplications([], "energy", "desc")).toEqual({
      items: [],
      total: null,
      counts: { ranked: 0, unranked: 0 },
    });
  });
});
