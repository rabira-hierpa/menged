import { prisma } from "@/lib/prisma";

/** A route is closed iff an active closure overlaps `now`. */
export function activeClosureFilter(now = new Date()) {
  return { startsAt: { lte: now }, endsAt: { gte: now } };
}

/** Set of routeIds that are currently closed. */
export async function getClosedRouteIds(now = new Date()) {
  const closures = await prisma.routeClosure.findMany({
    where: activeClosureFilter(now),
    select: { routeId: true },
  });
  return new Set(closures.map((c) => c.routeId));
}

export interface FareSummary {
  kind: "FLAT" | "TIERED";
  label: string;
}

export function summarizeFare(fare: {
  kind: "FLAT" | "TIERED";
  flatAmountEtb: { toNumber(): number } | null;
  tiers: { amountEtb: { toNumber(): number } }[];
} | null): FareSummary | null {
  if (!fare) return null;
  if (fare.kind === "FLAT") {
    const amount = fare.flatAmountEtb?.toNumber() ?? 0;
    return { kind: "FLAT", label: `Flat · ${amount} ETB` };
  }
  const prices = fare.tiers.map((t) => t.amountEtb.toNumber());
  if (prices.length === 0) return { kind: "TIERED", label: "Tiered" };
  return {
    kind: "TIERED",
    label: `Tiered · ${Math.min(...prices)}–${Math.max(...prices)} ETB`,
  };
}
