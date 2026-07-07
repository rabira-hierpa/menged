import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/** Lightweight search across routes and stops for the public map. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return Response.json({ routes: [], stops: [] });
  }

  const [routes, stops] = await Promise.all([
    prisma.route.findMany({
      where: {
        OR: [
          { shortName: { contains: q, mode: "insensitive" } },
          { longName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        shortName: true,
        longName: true,
        assignment: { select: { operator: { select: { code: true } } } },
      },
      take: 8,
      orderBy: { shortName: "asc" },
    }),
    prisma.stop.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, lat: true, lon: true },
      take: 8,
      orderBy: { name: "asc" },
    }),
  ]);

  return Response.json({
    routes: routes.map((r) => ({
      id: r.id,
      shortName: r.shortName,
      longName: r.longName,
      operatorCode: r.assignment?.operator.code ?? null,
    })),
    stops,
  });
}
