/**
 * GTFS 2026 import pipeline. Idempotent: truncates transit tables (never
 * auth tables) and re-imports from data/gtfs-2026.
 *
 * Operator classification uses the publisher's own sub-feeds as ground
 * truth: routes in the minibus sub-feed are MINIBUS; bus sub-feed routes
 * split by short-name prefix (AB=Anbessa, SH=Sheger, rest=Alliance);
 * route_type 0 is LRT.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../src/generated/prisma/client";
import type { OperatorCode } from "../../src/generated/prisma/enums";
import { buildRouteGeometry, groupShapes } from "./build-geojson";
import {
  readGtfsFile,
  type GtfsAgency,
  type GtfsCalendar,
  type GtfsFrequency,
  type GtfsRoute,
  type GtfsShapePoint,
  type GtfsStop,
  type GtfsStopTime,
  type GtfsTrip,
} from "./parse-gtfs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const BATCH = 1000;

async function batchedCreate<T>(
  rows: T[],
  create: (chunk: T[]) => Promise<unknown>,
) {
  for (let i = 0; i < rows.length; i += BATCH) {
    await create(rows.slice(i, i + BATCH));
  }
}

const OPERATORS: { code: OperatorCode; name: string; kind: string }[] = [
  { code: "ANBESSA", name: "Anbessa City Bus", kind: "Fixed-route bus" },
  { code: "SHEGER", name: "Sheger Mass Transport", kind: "Fixed-route bus" },
  { code: "ALLIANCE", name: "Alliance City Bus", kind: "Fixed-route bus" },
  {
    code: "MINIBUS",
    name: "Minibus Associations",
    kind: "Demand-responsive paratransit",
  },
  { code: "LRT", name: "Addis Ababa Light Rail", kind: "Light rail transit" },
];

function classifyOperator(
  route: GtfsRoute,
  minibusIds: Set<string>,
): OperatorCode {
  if (route.route_type === "0") return "LRT";
  if (minibusIds.has(route.route_id)) return "MINIBUS";
  if (route.route_short_name.startsWith("AB")) return "ANBESSA";
  if (route.route_short_name.startsWith("SH")) return "SHEGER";
  return "ALLIANCE";
}

/** Design defaults so Fare Management opens populated. All amounts in ETB. */
function defaultFare(code: OperatorCode): {
  kind: "FLAT" | "TIERED";
  flat?: number;
  tiers?: { label: string; fromKm: number; toKm: number | null; amount: number }[];
} {
  switch (code) {
    case "LRT":
      return {
        kind: "TIERED",
        tiers: [
          { label: "0–4 km", fromKm: 0, toKm: 4, amount: 10 },
          { label: "4–8 km", fromKm: 4, toKm: 8, amount: 15 },
          { label: "8+ km", fromKm: 8, toKm: null, amount: 20 },
        ],
      };
    case "MINIBUS":
      return {
        kind: "TIERED",
        tiers: [
          { label: "Short hop", fromKm: 0, toKm: 3, amount: 15 },
          { label: "Mid", fromKm: 3, toKm: 7, amount: 25 },
          { label: "Full corridor", fromKm: 7, toKm: null, amount: 35 },
        ],
      };
    case "ANBESSA":
      return { kind: "FLAT", flat: 10 };
    default: // SHEGER, ALLIANCE
      return { kind: "FLAT", flat: 15 };
  }
}

async function main() {
  console.time("seed");

  console.log("Parsing GTFS files…");
  const agencies = readGtfsFile<GtfsAgency>("combined/agency.txt");
  const routes = readGtfsFile<GtfsRoute>("combined/routes.txt");
  const stops = readGtfsFile<GtfsStop>("combined/stops.txt");
  const trips = readGtfsFile<GtfsTrip>("combined/trips.txt");
  const stopTimes = readGtfsFile<GtfsStopTime>("combined/stop_times.txt");
  const frequencies = readGtfsFile<GtfsFrequency>("combined/frequencies.txt");
  const calendars = readGtfsFile<GtfsCalendar>("combined/calendar.txt");
  const shapePoints = readGtfsFile<GtfsShapePoint>("combined/shapes.txt");
  const minibusIds = new Set(
    readGtfsFile<GtfsRoute>("minibus/routes.txt").map((r) => r.route_id),
  );

  console.log("Building route geometries…");
  const shapes = groupShapes(shapePoints);
  // Route → shape via its first trip that has a shape.
  const routeShapeId = new Map<string, string>();
  for (const trip of trips) {
    if (trip.shape_id && !routeShapeId.has(trip.route_id)) {
      routeShapeId.set(trip.route_id, trip.shape_id);
    }
  }

  console.log("Truncating transit tables…");
  await prisma.routeClosure.deleteMany();
  await prisma.routeAssignment.deleteMany();
  await prisma.fareTier.deleteMany();
  await prisma.fare.deleteMany();
  await prisma.frequency.deleteMany();
  await prisma.stopTime.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.calendar.deleteMany();
  await prisma.route.deleteMany();
  await prisma.stop.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.agency.deleteMany();

  console.log("Importing agencies and operators…");
  await prisma.agency.createMany({
    data: agencies.map((a) => ({
      id: a.agency_id,
      name: a.agency_name,
      url: a.agency_url || null,
      timezone: a.agency_timezone || null,
    })),
  });
  await prisma.operator.createMany({ data: OPERATORS });
  const operatorIdByCode = new Map(
    (await prisma.operator.findMany()).map((o) => [o.code, o.id]),
  );

  console.log("Importing stops…");
  await batchedCreate(stops, (chunk) =>
    prisma.stop.createMany({
      data: chunk.map((s) => ({
        id: s.stop_id,
        name: s.stop_name,
        lat: Number(s.stop_lat),
        lon: Number(s.stop_lon),
      })),
      skipDuplicates: true,
    }),
  );

  console.log("Importing routes…");
  const routeOperator = new Map<string, OperatorCode>();
  await batchedCreate(routes, (chunk) =>
    prisma.route.createMany({
      data: chunk.map((r) => {
        const code = classifyOperator(r, minibusIds);
        routeOperator.set(r.route_id, code);
        const shapeId = routeShapeId.get(r.route_id);
        const coords = shapeId ? shapes.get(shapeId) : undefined;
        const geometry = coords ? buildRouteGeometry(coords) : null;
        return {
          id: r.route_id,
          shortName: r.route_short_name,
          longName: r.route_long_name,
          type: Number(r.route_type),
          color: r.route_color || null,
          textColor: r.route_text_color || null,
          agencyId: r.agency_id,
          geojson: geometry
            ? (geometry.geojson as unknown as Prisma.InputJsonValue)
            : undefined,
          geojsonSimplified: geometry
            ? (geometry.geojsonSimplified as unknown as Prisma.InputJsonValue)
            : undefined,
          lengthMeters: geometry?.lengthMeters ?? null,
        };
      }),
      skipDuplicates: true,
    }),
  );

  console.log("Importing calendar, trips, stop times, frequencies…");
  await prisma.calendar.createMany({
    data: calendars.map((c) => ({
      serviceId: c.service_id,
      monday: c.monday === "1",
      tuesday: c.tuesday === "1",
      wednesday: c.wednesday === "1",
      thursday: c.thursday === "1",
      friday: c.friday === "1",
      saturday: c.saturday === "1",
      sunday: c.sunday === "1",
      startDate: c.start_date,
      endDate: c.end_date,
    })),
  });
  await batchedCreate(trips, (chunk) =>
    prisma.trip.createMany({
      data: chunk.map((t) => ({
        id: t.trip_id,
        routeId: t.route_id,
        serviceId: t.service_id,
        shapeId: t.shape_id || null,
        headsign: t.trip_headsign || null,
      })),
      skipDuplicates: true,
    }),
  );
  const validStopIds = new Set(stops.map((s) => s.stop_id));
  await batchedCreate(
    stopTimes.filter((st) => validStopIds.has(st.stop_id)),
    (chunk) =>
      prisma.stopTime.createMany({
        data: chunk.map((st) => ({
          tripId: st.trip_id,
          stopId: st.stop_id,
          sequence: Number(st.stop_sequence),
          arrival: st.arrival_time || null,
          departure: st.departure_time || null,
        })),
        skipDuplicates: true,
      }),
  );
  await batchedCreate(frequencies, (chunk) =>
    prisma.frequency.createMany({
      data: chunk.map((f) => {
        const toSecs = (t: string) => {
          const [h, m, s] = t.split(":").map(Number);
          return h * 3600 + m * 60 + s;
        };
        const window = toSecs(f.end_time) - toSecs(f.start_time);
        const headway = Math.min(Number(f.headway_secs), Math.max(window, 60));
        return {
          tripId: f.trip_id,
          startTime: f.start_time,
          endTime: f.end_time,
          headwaySecs: headway,
        };
      }),
    }),
  );

  console.log("Assigning operators and default fares…");
  await batchedCreate([...routeOperator.entries()], (chunk) =>
    prisma.routeAssignment.createMany({
      data: chunk.map(([routeId, code]) => ({
        routeId,
        operatorId: operatorIdByCode.get(code)!,
      })),
    }),
  );
  for (const [routeId, code] of routeOperator) {
    const fare = defaultFare(code);
    await prisma.fare.create({
      data: {
        routeId,
        kind: fare.kind,
        flatAmountEtb: fare.flat,
        tiers: fare.tiers
          ? {
              create: fare.tiers.map((t) => ({
                label: t.label,
                fromKm: t.fromKm,
                toKm: t.toKm,
                amountEtb: t.amount,
              })),
            }
          : undefined,
      },
    });
  }

  const counts = {
    agencies: await prisma.agency.count(),
    operators: await prisma.operator.count(),
    routes: await prisma.route.count(),
    stops: await prisma.stop.count(),
    trips: await prisma.trip.count(),
    stopTimes: await prisma.stopTime.count(),
    frequencies: await prisma.frequency.count(),
    fares: await prisma.fare.count(),
    assignments: await prisma.routeAssignment.count(),
  };
  console.log(counts);
  const byOperator = await prisma.routeAssignment.groupBy({
    by: ["operatorId"],
    _count: true,
  });
  for (const g of byOperator) {
    const op = OPERATORS.find(
      (o) => operatorIdByCode.get(o.code) === g.operatorId,
    );
    console.log(`  ${op?.code}: ${g._count} routes`);
  }
  console.timeEnd("seed");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
