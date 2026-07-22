import { describe, expect, it } from "vitest";
import {
  MAX_FARE_ETB,
  reviewProposalSchema,
  submitProposalSchema,
} from "./proposal-schema";

describe("submitProposalSchema — FLAT", () => {
  it("accepts a positive flat amount", () => {
    const parsed = submitProposalSchema.safeParse({
      routeId: "AB001",
      kind: "FLAT",
      flatAmountEtb: 20,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects zero or negative amounts", () => {
    for (const amount of [0, -1]) {
      const parsed = submitProposalSchema.safeParse({
        routeId: "AB001",
        kind: "FLAT",
        flatAmountEtb: amount,
      });
      expect(parsed.success).toBe(false);
    }
  });

  it("rejects amounts above the ceiling (outside-voice guard)", () => {
    const parsed = submitProposalSchema.safeParse({
      routeId: "AB001",
      kind: "FLAT",
      flatAmountEtb: MAX_FARE_ETB + 1,
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts exactly the ceiling", () => {
    const parsed = submitProposalSchema.safeParse({
      routeId: "AB001",
      kind: "FLAT",
      flatAmountEtb: MAX_FARE_ETB,
    });
    expect(parsed.success).toBe(true);
  });

  it("caps the optional note length", () => {
    const parsed = submitProposalSchema.safeParse({
      routeId: "AB001",
      kind: "FLAT",
      flatAmountEtb: 20,
      note: "x".repeat(281),
    });
    expect(parsed.success).toBe(false);
  });
});

describe("submitProposalSchema — TIERED", () => {
  it("accepts tiers with positive amounts", () => {
    const parsed = submitProposalSchema.safeParse({
      routeId: "TX014",
      kind: "TIERED",
      tiers: [{ label: "0–5 km", fromKm: 0, toKm: 5, amountEtb: 15 }],
    });
    expect(parsed.success).toBe(true);
  });

  it("requires at least one tier", () => {
    const parsed = submitProposalSchema.safeParse({
      routeId: "TX014",
      kind: "TIERED",
      tiers: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a tier amount over the ceiling", () => {
    const parsed = submitProposalSchema.safeParse({
      routeId: "TX014",
      kind: "TIERED",
      tiers: [
        { label: "long", fromKm: 0, toKm: null, amountEtb: MAX_FARE_ETB + 5 },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("reviewProposalSchema", () => {
  it("accepts approve / reject decisions", () => {
    expect(
      reviewProposalSchema.safeParse({ proposalId: "p1", decision: "approve" })
        .success,
    ).toBe(true);
    expect(
      reviewProposalSchema.safeParse({ proposalId: "p1", decision: "reject" })
        .success,
    ).toBe(true);
  });

  it("rejects an unknown decision", () => {
    expect(
      reviewProposalSchema.safeParse({ proposalId: "p1", decision: "maybe" })
        .success,
    ).toBe(false);
  });
});
