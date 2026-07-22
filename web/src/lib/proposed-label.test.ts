import { describe, expect, it } from "vitest";
import { formatProposedLabel } from "./proposed-label";

describe("formatProposedLabel", () => {
  it("formats FLAT fares", () => {
    expect(
      formatProposedLabel({
        proposedKind: "FLAT",
        proposedFlatEtb: { toNumber: () => 20 },
        proposedTiers: null,
      }),
    ).toBe("Flat · 20 ETB");
  });

  it("formats empty TIERED as Tiered", () => {
    expect(
      formatProposedLabel({
        proposedKind: "TIERED",
        proposedFlatEtb: null,
        proposedTiers: [],
      }),
    ).toBe("Tiered");
  });

  it("formats TIERED as a min–max range", () => {
    expect(
      formatProposedLabel({
        proposedKind: "TIERED",
        proposedFlatEtb: null,
        proposedTiers: [{ amountEtb: 10 }, { amountEtb: 35 }, { amountEtb: 20 }],
      }),
    ).toBe("Tiered · 10–35 ETB");
  });
});
