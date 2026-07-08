import { OPERATOR_META, type OperatorCode } from "@/lib/operators";
import { prisma } from "@/lib/prisma";
import { activeClosureFilter } from "@/lib/transit";

/**
 * Supply-side network analytics computed from GTFS data, closures, and
 * fares. There is no ridership feed, so capacity figures are modeled
 * estimates (clearly labeled in the UI), not measured boardings.
 */

/** Assumed vehicle capacity (seated + standing) per mode for estimates. */
const VEHICLE_CAPACITY: Record<string, number> = {
  LRT: 286, // AW CNR trainset
  MINIBUS: 12,
  BUS: 60, // city bus average
};

function parseGtfsTime(value: string): number | null {
  // "HH:MM:SS", hours may exceed 24 in GTFS.
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 3600 + m * 60;
}

export interface OperatorStats {
  code: OperatorCode;
  name: string;
  color: string;
  routes: number;
  networkKm: number;
  avgHeadwayMin: number | null;
  avgFareEtb: number | null;
  flatFares: number;
  tieredFares: number;
  estDailyCapacity: number;
  closedNow: number;
}

export interface HeadwayBucket {
  label: string;
  routes: number;
}

export interface ClosureDay {
  date: string; // YYYY-MM-DD
  PUBLIC_HOLIDAY: number;
  MAINTENANCE: number;
  POLITICAL_EVENT: number;
  OTHER: number;
}

export interface NetworkAnalytics {
  generatedAt: string;
  kpis: {
    routes: number;
    networkKm: number;
    stops: number;
    avgHeadwayMin: number | null;
    avgServiceSpanH: number | null;
    closedNow: number;
    closureDays90: number;
    estDailySeatKm: number;
  };
  operators: OperatorStats[];
  headwayBuckets: HeadwayBucket[];
  closuresByDay: ClosureDay[];
  fareByOperator: {
    code: OperatorCode;
    name: string;
    color: string;
    avgFareEtb: number;
    farePerKmEtb: number | null;
  }[];
}

const HEADWAY_BUCKETS = [
  { label: "≤ 10 min", max: 10 },
  { label: "10–20 min", max: 20 },
  { label: "20–30 min", max: 30 },
  { label: "30–45 min", max: 45 },
  { label: "45–60 min", max: 60 },
  { label: "> 60 min", max: Infinity },
];

export async function computeNetworkAnalytics(): Promise<NetworkAnalytics> {
  const now = new Date();
  const since90 = new Date(now.getTime() - 90 * 24 * 3600 * 1000);

  const [routes, stopCount, closures90, activeClosures] = await Promise.all([
    prisma.route.findMany({
      select: {
        id: true,
        type: true,
        lengthMeters: true,
        assignment: { select: { operator: { select: { code: true } } } },
        fare: {
          select: {
            kind: true,
            flatAmountEtb: true,
            tiers: { select: { amountEtb: true } },
          },
        },
        trips: {
          select: {
            frequencies: {
              select: { startTime: true, endTime: true, headwaySecs: true },
            },
          },
          take: 1,
        },
      },
    }),
    prisma.stop.count(),
    prisma.routeClosure.findMany({
      where: { endsAt: { gte: since90 }, startsAt: { lte: now } },
      select: { routeId: true, reason: true, startsAt: true, endsAt: true },
    }),
    prisma.routeClosure.findMany({
      where: activeClosureFilter(now),
      select: { routeId: true },
    }),
  ]);

  const closedNowIds = new Set(activeClosures.map((c) => c.routeId));

  // Per-route derived metrics.
  interface RouteMetrics {
    operator: OperatorCode | null;
    km: number;
    headwayMin: number | null;
    spanH: number | null;
    avgFare: number | null;
    fareKind: "FLAT" | "TIERED" | null;
    dailyTrips: number;
    capacityPerTrip: number;
    closedNow: boolean;
  }

  const routeMetrics: RouteMetrics[] = routes.map((route) => {
    const operator =
      (route.assignment?.operator.code as OperatorCode | undefined) ?? null;
    const km = (route.lengthMeters ?? 0) / 1000;

    const frequencies = route.trips[0]?.frequencies ?? [];
    let headwayMin: number | null = null;
    let spanH: number | null = null;
    let dailyTrips = 0;
    if (frequencies.length > 0) {
      const headways = frequencies.map((f) => f.headwaySecs);
      headwayMin = headways.reduce((a, b) => a + b, 0) / headways.length / 60;
      let spanSeconds = 0;
      for (const f of frequencies) {
        const start = parseGtfsTime(f.startTime);
        const end = parseGtfsTime(f.endTime);
        if (start != null && end != null && end > start) {
          spanSeconds += end - start;
          dailyTrips += Math.floor((end - start) / f.headwaySecs);
        }
      }
      spanH = spanSeconds / 3600;
    }

    let avgFare: number | null = null;
    if (route.fare) {
      if (route.fare.kind === "FLAT") {
        avgFare = route.fare.flatAmountEtb?.toNumber() ?? null;
      } else if (route.fare.tiers.length > 0) {
        const prices = route.fare.tiers.map((t) => t.amountEtb.toNumber());
        avgFare = prices.reduce((a, b) => a + b, 0) / prices.length;
      }
    }

    const capacityPerTrip =
      route.type === 0
        ? VEHICLE_CAPACITY.LRT
        : operator === "MINIBUS"
          ? VEHICLE_CAPACITY.MINIBUS
          : VEHICLE_CAPACITY.BUS;

    return {
      operator,
      km,
      headwayMin,
      spanH,
      avgFare,
      fareKind: route.fare?.kind ?? null,
      dailyTrips,
      capacityPerTrip,
      closedNow: closedNowIds.has(route.id),
    };
  });

  // Network KPIs.
  const withHeadway = routeMetrics.filter((r) => r.headwayMin != null);
  const withSpan = routeMetrics.filter((r) => r.spanH != null);
  const networkKm = routeMetrics.reduce((sum, r) => sum + r.km, 0);
  const estDailySeatKm = Math.round(
    routeMetrics.reduce(
      (sum, r) => sum + r.dailyTrips * r.capacityPerTrip * r.km,
      0,
    ),
  );

  // 90-day closure-days: sum of per-closure overlap with the window, in days.
  let closureDays90 = 0;
  for (const closure of closures90) {
    const start = Math.max(closure.startsAt.getTime(), since90.getTime());
    const end = Math.min(closure.endsAt.getTime(), now.getTime());
    if (end > start) closureDays90 += (end - start) / (24 * 3600 * 1000);
  }

  // Operator stats.
  const operators: OperatorStats[] = (
    Object.values(OPERATOR_META) as (typeof OPERATOR_META)[OperatorCode][]
  ).map((meta) => {
    const rows = routeMetrics.filter((r) => r.operator === meta.code);
    const headways = rows.filter((r) => r.headwayMin != null);
    const fares = rows.filter((r) => r.avgFare != null);
    return {
      code: meta.code,
      name: meta.name,
      color: meta.color,
      routes: rows.length,
      networkKm: Math.round(rows.reduce((sum, r) => sum + r.km, 0)),
      avgHeadwayMin:
        headways.length > 0
          ? headways.reduce((sum, r) => sum + r.headwayMin!, 0) /
            headways.length
          : null,
      avgFareEtb:
        fares.length > 0
          ? fares.reduce((sum, r) => sum + r.avgFare!, 0) / fares.length
          : null,
      flatFares: rows.filter((r) => r.fareKind === "FLAT").length,
      tieredFares: rows.filter((r) => r.fareKind === "TIERED").length,
      estDailyCapacity: Math.round(
        rows.reduce((sum, r) => sum + r.dailyTrips * r.capacityPerTrip, 0),
      ),
      closedNow: rows.filter((r) => r.closedNow).length,
    };
  });

  // Headway histogram.
  const headwayBuckets: HeadwayBucket[] = HEADWAY_BUCKETS.map((bucket) => ({
    label: bucket.label,
    routes: 0,
  }));
  for (const row of withHeadway) {
    const index = HEADWAY_BUCKETS.findIndex((b) => row.headwayMin! <= b.max);
    headwayBuckets[index === -1 ? HEADWAY_BUCKETS.length - 1 : index].routes++;
  }

  // Closures per day over the last 90 days (by reason).
  const dayMap = new Map<string, ClosureDay>();
  for (let i = 0; i <= 90; i++) {
    const date = new Date(since90.getTime() + i * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    dayMap.set(date, {
      date,
      PUBLIC_HOLIDAY: 0,
      MAINTENANCE: 0,
      POLITICAL_EVENT: 0,
      OTHER: 0,
    });
  }
  for (const closure of closures90) {
    const start = Math.max(closure.startsAt.getTime(), since90.getTime());
    const end = Math.min(closure.endsAt.getTime(), now.getTime());
    for (let t = start; t <= end; t += 24 * 3600 * 1000) {
      const date = new Date(t).toISOString().slice(0, 10);
      const day = dayMap.get(date);
      if (day) day[closure.reason as keyof Omit<ClosureDay, "date">]++;
    }
  }

  const fareByOperator = operators
    .filter((op) => op.avgFareEtb != null && op.routes > 0)
    .map((op) => ({
      code: op.code,
      name: op.name,
      color: op.color,
      avgFareEtb: Number(op.avgFareEtb!.toFixed(1)),
      farePerKmEtb:
        op.networkKm > 0 && op.routes > 0
          ? Number(
              (op.avgFareEtb! / (op.networkKm / op.routes)).toFixed(2),
            )
          : null,
    }));

  return {
    generatedAt: now.toISOString(),
    kpis: {
      routes: routes.length,
      networkKm: Math.round(networkKm),
      stops: stopCount,
      avgHeadwayMin:
        withHeadway.length > 0
          ? withHeadway.reduce((sum, r) => sum + r.headwayMin!, 0) /
            withHeadway.length
          : null,
      avgServiceSpanH:
        withSpan.length > 0
          ? withSpan.reduce((sum, r) => sum + r.spanH!, 0) / withSpan.length
          : null,
      closedNow: closedNowIds.size,
      closureDays90: Number(closureDays90.toFixed(1)),
      estDailySeatKm,
    },
    operators,
    headwayBuckets,
    closuresByDay: [...dayMap.values()],
    fareByOperator,
  };
}
