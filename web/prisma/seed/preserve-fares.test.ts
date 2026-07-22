import { execFileSync } from "node:child_process";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";

/**
 * CRITICAL regression (design T0): the seed must NOT wipe crowdsourced fares.
 * A reseed in the default (preserve) mode has to leave an edited fare intact;
 * only `--destructive` may reset it. If this ever breaks, an operator re-running
 * the seed silently discards every rider correction.
 *
 * DB-backed and destructive, so it is gated on RUN_DB_TESTS=1 (CI sets it against
 * an ephemeral Postgres). It never runs against a dev database by default.
 */
const RUN = process.env.RUN_DB_TESTS === "1";
const suite = RUN ? describe : describe.skip;

const SENTINEL = 987.5;
const seedEntry = path.resolve(__dirname, "index.ts");

function runSeed(destructive = false) {
  execFileSync(
    "npx",
    ["tsx", seedEntry, ...(destructive ? ["--destructive"] : [])],
    { stdio: "inherit", env: process.env, cwd: path.resolve(__dirname, "..", "..") },
  );
}

suite("seed fare preservation", () => {
  let routeId: string;

  beforeAll(async () => {
    // Ensure the graph exists (CI seeds once before the test job runs).
    const route = await prisma.route.findFirst({ select: { id: true } });
    if (!route) {
      runSeed(true);
    }
    const seeded = await prisma.route.findFirst({ select: { id: true } });
    routeId = seeded!.id;
  }, 300_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("preserve mode (default) keeps an edited fare", async () => {
    // Stamp a sentinel fare a rider correction might have produced.
    await prisma.fare.upsert({
      where: { routeId },
      create: { routeId, kind: "FLAT", flatAmountEtb: SENTINEL },
      update: { kind: "FLAT", flatAmountEtb: SENTINEL, tiers: { deleteMany: {} } },
    });

    runSeed(false);

    const after = await prisma.fare.findUnique({ where: { routeId } });
    expect(after?.flatAmountEtb?.toNumber()).toBe(SENTINEL);
  }, 300_000);

  it("--destructive resets the fare to its seeded default", async () => {
    await prisma.fare.update({
      where: { routeId },
      data: { kind: "FLAT", flatAmountEtb: SENTINEL, tiers: { deleteMany: {} } },
    });

    runSeed(true);

    const after = await prisma.fare.findUnique({ where: { routeId } });
    expect(after?.flatAmountEtb?.toNumber()).not.toBe(SENTINEL);
  }, 300_000);
});
