#!/usr/bin/env node
/**
 * GTFS validator gate (design §GTFS Export). Compares a candidate MobilityData
 * validator report against a baseline and fails (exit 1) when any ERROR-severity
 * notice code exceeds its baseline count — i.e. the overlay introduced a new or
 * worse error. WARNING/INFO notices never fail the gate.
 *
 * Usage: node validate-feed-diff.mjs <baseline-report.json> <candidate-report.json>
 *
 * In CI the "baseline" is the base combined feed's own report and the
 * "candidate" is the fares-overlay feed's report, so the gate means: the
 * overlay must not add errors the base feed did not already have.
 */
import { readFileSync } from "node:fs";
import {
  errorCountsFromReport,
  findRegressions,
} from "./validate-feed-diff-lib.mjs";

function errorCounts(reportPath) {
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  return errorCountsFromReport(report);
}

const [, , baselinePath, candidatePath] = process.argv;
if (!baselinePath || !candidatePath) {
  console.error(
    "usage: validate-feed-diff.mjs <baseline-report.json> <candidate-report.json>",
  );
  process.exit(2);
}

const baseline = errorCounts(baselinePath);
const candidate = errorCounts(candidatePath);
const regressions = findRegressions(baseline, candidate);

if (regressions.length > 0) {
  console.error("✗ GTFS validator gate FAILED — new or increased errors:");
  for (const r of regressions) {
    console.error(`    ${r.code}: baseline ${r.base} → candidate ${r.count}`);
  }
  process.exit(1);
}

console.log(
  "✓ GTFS validator gate passed — overlay adds no errors beyond the base feed.",
);
