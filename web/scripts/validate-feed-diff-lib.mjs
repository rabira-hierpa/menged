/**
 * Pure helpers for the GTFS validator gate (see validate-feed-diff.mjs).
 * Kept separate so Vitest can exercise regression detection without spawning
 * the CLI entrypoint.
 */
export function errorCountsFromReport(report) {
  const counts = new Map();
  for (const notice of report.notices ?? []) {
    const severity = String(notice.severity ?? "").toUpperCase();
    if (severity !== "ERROR") continue;
    const total = notice.totalNotices ?? notice.sampleNotices?.length ?? 0;
    counts.set(notice.code, total);
  }
  return counts;
}

export function findRegressions(baseline, candidate) {
  const regressions = [];
  for (const [code, count] of candidate) {
    const base = baseline.get(code) ?? 0;
    if (count > base) regressions.push({ code, base, count });
  }
  return regressions;
}
