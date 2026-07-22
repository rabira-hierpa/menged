/**
 * Pure GTFS fares-overlay formatting — no filesystem, DB, or zip deps, so it
 * unit-tests without a database. `gtfs-export.ts` reads the Fare table, passes
 * rows through here, and streams the results into the zip.
 */

export interface ExportFare {
  routeId: string;
  kind: "FLAT" | "TIERED";
  flatAmountEtb: number | null;
}

export interface FlatFare {
  routeId: string;
  price: number;
}

/**
 * Apply the V1 export rule: only FLAT fares with a positive amount are
 * exportable. TIERED fares are OMITTED (decision 4A) — Fares V1 without stop
 * zones can carry only one price per route, and shipping the tier ceiling would
 * overstate short trips. Result is sorted by routeId for deterministic output.
 */
export function selectFlatFares(fares: ExportFare[]): FlatFare[] {
  return fares
    .filter(
      (f) => f.kind === "FLAT" && f.flatAmountEtb != null && f.flatAmountEtb > 0,
    )
    .map((f) => ({ routeId: f.routeId, price: f.flatAmountEtb! }))
    .sort((a, b) => a.routeId.localeCompare(b.routeId));
}

export function fareAttributesCsv(fares: FlatFare[]): string {
  const lines = ["fare_id,price,currency_type,payment_method,transfers"];
  for (const f of fares) {
    // payment_method=0 (paid on board); transfers empty = unlimited.
    lines.push(`f_${f.routeId},${f.price.toFixed(2)},ETB,0,`);
  }
  return lines.join("\n") + "\n";
}

export function fareRulesCsv(fares: FlatFare[]): string {
  const lines = ["fare_id,route_id"];
  for (const f of fares) lines.push(`f_${f.routeId},${f.routeId}`);
  return lines.join("\n") + "\n";
}

export function feedInfoCsv(version: number): string {
  return (
    [
      "feed_publisher_name,feed_publisher_url,feed_lang,feed_start_date,feed_end_date,feed_version,feed_contact_email,feed_contact_url",
      `Dandii (Addis Ababa Transit),https://digitaltransport4africa.org/,en,20191201,20991231,dandii-v${version},info@addismap.com,https://addismaptransit.com/support/`,
    ].join("\n") + "\n"
  );
}
