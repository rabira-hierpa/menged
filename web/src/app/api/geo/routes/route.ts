import { prisma } from "@/lib/prisma";
import { getClosedRouteIds } from "@/lib/transit";

/**
 * All route shapes (simplified) as a GeoJSON FeatureCollection.
 * Cached at the CDN for an hour; closure state is refreshed on revalidation
 * from the console actions.
 */
export async function GET() {
  const [routes, closedIds] = await Promise.all([
    prisma.route.findMany({
      select: {
        id: true,
        shortName: true,
        longName: true,
        type: true,
        geojsonSimplified: true,
        lengthMeters: true,
        assignment: { select: { operator: { select: { code: true } } } },
      },
    }),
    getClosedRouteIds(),
  ]);

  const features = routes
    .filter((r) => r.geojsonSimplified)
    .map((r) => ({
      type: "Feature" as const,
      geometry: r.geojsonSimplified,
      properties: {
        routeId: r.id,
        shortName: r.shortName,
        longName: r.longName,
        routeType: r.type,
        operatorCode: r.assignment?.operator.code ?? null,
        lengthMeters: r.lengthMeters,
        closed: closedIds.has(r.id),
      },
    }));

  return Response.json(
    { type: "FeatureCollection", features },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    },
  );
}
