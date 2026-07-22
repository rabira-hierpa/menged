import { describe, expect, it } from "vitest";
import {
  fareAttributesCsv,
  fareRulesCsv,
  feedInfoCsv,
  selectFlatFares,
  type ExportFare,
} from "./gtfs-fares-format";

describe("selectFlatFares", () => {
  it("keeps FLAT fares and omits TIERED ones (decision 4A)", () => {
    const fares: ExportFare[] = [
      { routeId: "AB001", kind: "FLAT", flatAmountEtb: 20 },
      { routeId: "TX014", kind: "TIERED", flatAmountEtb: null },
      { routeId: "AB010", kind: "FLAT", flatAmountEtb: 12 },
    ];
    const result = selectFlatFares(fares);
    expect(result.map((f) => f.routeId)).toEqual(["AB001", "AB010"]);
    expect(result.find((f) => f.routeId === "TX014")).toBeUndefined();
  });

  it("drops FLAT fares with a null or non-positive amount", () => {
    const fares: ExportFare[] = [
      { routeId: "R1", kind: "FLAT", flatAmountEtb: null },
      { routeId: "R2", kind: "FLAT", flatAmountEtb: 0 },
      { routeId: "R3", kind: "FLAT", flatAmountEtb: -5 },
      { routeId: "R4", kind: "FLAT", flatAmountEtb: 15 },
    ];
    expect(selectFlatFares(fares).map((f) => f.routeId)).toEqual(["R4"]);
  });

  it("sorts by routeId for deterministic output", () => {
    const fares: ExportFare[] = [
      { routeId: "C", kind: "FLAT", flatAmountEtb: 10 },
      { routeId: "A", kind: "FLAT", flatAmountEtb: 10 },
      { routeId: "B", kind: "FLAT", flatAmountEtb: 10 },
    ];
    expect(selectFlatFares(fares).map((f) => f.routeId)).toEqual([
      "A",
      "B",
      "C",
    ]);
  });
});

describe("fareAttributesCsv", () => {
  it("emits the GTFS header and one row per fare with 2-decimal price", () => {
    const csv = fareAttributesCsv([{ routeId: "AB001", price: 20 }]);
    const lines = csv.trimEnd().split("\n");
    expect(lines[0]).toBe(
      "fare_id,price,currency_type,payment_method,transfers",
    );
    // f_<routeId>, price with 2 decimals, ETB, payment_method 0, empty transfers
    expect(lines[1]).toBe("f_AB001,20.00,ETB,0,");
  });

  it("returns a header-only file when there are no fares", () => {
    expect(fareAttributesCsv([])).toBe(
      "fare_id,price,currency_type,payment_method,transfers\n",
    );
  });
});

describe("fareRulesCsv", () => {
  it("keys each fare to its route_id", () => {
    const csv = fareRulesCsv([
      { routeId: "AB001", price: 20 },
      { routeId: "AB010", price: 12 },
    ]);
    expect(csv).toBe("fare_id,route_id\nf_AB001,AB001\nf_AB010,AB010\n");
  });
});

describe("feedInfoCsv", () => {
  it("stamps the Dandii publisher and the versioned feed_version", () => {
    const csv = feedInfoCsv(3);
    expect(csv).toContain("Dandii (Addis Ababa Transit)");
    expect(csv).toContain("dandii-v3");
  });
});
