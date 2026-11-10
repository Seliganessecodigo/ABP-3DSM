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
});
