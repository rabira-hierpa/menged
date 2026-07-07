import { prisma } from "@/lib/prisma";
import { activeClosureFilter, summarizeFare } from "@/lib/transit";

/**
 * Route detail for the public map sheet: full geometry, ordered stops of the
 * first trip, headways, fare, and any active closure.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ routeId: string }> },
) {
  const { routeId } = await params;

  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: {
      id: true,
      shortName: true,
      longName: true,
      type: true,
      geojson: true,
      lengthMeters: true,
      assignment: {
        select: { operator: { select: { code: true, name: true } } },
      },
      fare: {
        select: {
          kind: true,
          flatAmountEtb: true,
          tiers: {
            select: { label: true, fromKm: true, toKm: true, amountEtb: true },
            orderBy: { fromKm: "asc" },
          },
        },
      },
      closures: {
        where: activeClosureFilter(),
        select: { reason: true, note: true, startsAt: true, endsAt: true },
        orderBy: { endsAt: "desc" },
        take: 1,
      },
      trips: {
        take: 1,
        select: {
          headsign: true,
          frequencies: {
            select: { startTime: true, endTime: true, headwaySecs: true },
            orderBy: { startTime: "asc" },
          },
          stopTimes: {
            orderBy: { sequence: "asc" },
            select: {
              sequence: true,
              stop: { select: { id: true, name: true, lat: true, lon: true } },
            },
          },
        },
      },
    },
  });

  if (!route) {
    return Response.json({ error: "Route not found" }, { status: 404 });
  }

  const trip = route.trips[0];
  return Response.json({
    id: route.id,
    shortName: route.shortName,
    longName: route.longName,
    routeType: route.type,
    lengthMeters: route.lengthMeters,
    geojson: route.geojson,
    operator: route.assignment?.operator ?? null,
    fare: route.fare
      ? {
          kind: route.fare.kind,
          flatAmountEtb: route.fare.flatAmountEtb?.toNumber() ?? null,
          summary: summarizeFare(route.fare)?.label ?? null,
          tiers: route.fare.tiers.map((t) => ({
            label: t.label,
            fromKm: t.fromKm,
            toKm: t.toKm,
            amountEtb: t.amountEtb.toNumber(),
          })),
        }
      : null,
    closure: route.closures[0] ?? null,
    headsign: trip?.headsign ?? null,
    frequencies: trip?.frequencies ?? [],
    stops: trip?.stopTimes.map((st) => st.stop) ?? [],
  });
}
