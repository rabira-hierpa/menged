import { ZipArchive } from "archiver";
import { createWriteStream } from "node:fs";
import { mkdir, readdir, readFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import {
  fareAttributesCsv,
  fareRulesCsv,
  feedInfoCsv,
  selectFlatFares,
  type FlatFare,
} from "@/lib/gtfs-fares-format";
import { prisma } from "@/lib/prisma";

/**
 * GTFS "fares overlay" exporter (design §GTFS Export). The generated zip copies
 * the vendored base feed byte-for-byte and adds/replaces exactly three files:
 * fare_attributes.txt, fare_rules.txt (regenerated from the Fare table) and
 * feed_info.txt (feed_version bumped). TIERED fares are OMITTED (decision 4A):
 * Fares V1 without stop zones can carry only one price per route, and shipping
 * the ceiling would overstate short trips — dishonest for an accuracy product.
 */

/**
 * Candidate locations for the vendored combined feed. The dev server's cwd is
 * the repo root, standalone prod runs from web/, and GTFS_BASE_DIR overrides
 * both — so probe all three and use the first that actually holds a feed.
 */
const BASE_DIR_CANDIDATES = [
  process.env.GTFS_BASE_DIR,
  path.resolve(process.cwd(), "data", "gtfs-2026", "combined"),
  path.resolve(process.cwd(), "..", "data", "gtfs-2026", "combined"),
].filter((p): p is string => Boolean(p));

async function resolveBaseDir(): Promise<string> {
  for (const dir of BASE_DIR_CANDIDATES) {
    try {
      await stat(path.join(dir, "routes.txt"));
      return dir;
    } catch {
      // try next candidate
    }
  }
  throw new Error(
    `Base GTFS feed not found. Looked in: ${BASE_DIR_CANDIDATES.join(", ")}. Set GTFS_BASE_DIR to the combined feed directory.`,
  );
}

/** Where generated zips are written (a Docker volume in production). */
const EXPORT_DIR =
  process.env.GTFS_EXPORT_DIR ??
  path.resolve(process.cwd(), "..", ".gtfs-exports");

/** Keep the newest N zips on the volume; older zip FILES are pruned (rows stay). */
const KEEP_ZIPS = 10;

/** Files we regenerate — skipped when copying the base feed. */
const REPLACED = new Set([
  "feed_info.txt",
  "fare_attributes.txt",
  "fare_rules.txt",
]);

/** Copy the base feed + overlay the three generated files into `filePath`. */
async function buildZip(
  filePath: string,
  baseDir: string,
  version: number,
  fares: FlatFare[],
): Promise<void> {
  const output = createWriteStream(filePath);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  const done = new Promise<void>((resolve, reject) => {
    output.on("close", () => resolve());
    output.on("error", reject);
    archive.on("error", reject);
  });

  archive.pipe(output);

  const entries = await readdir(baseDir);
  for (const name of entries) {
    if (!name.endsWith(".txt") || REPLACED.has(name)) continue;
    archive.file(path.join(baseDir, name), { name });
  }

  archive.append(feedInfoCsv(version), { name: "feed_info.txt" });
  archive.append(fareAttributesCsv(fares), { name: "fare_attributes.txt" });
  archive.append(fareRulesCsv(fares), { name: "fare_rules.txt" });

  await archive.finalize();
  await done;
}

/**
 * route_ids present in the base feed's routes.txt. A fare_rules row for a
 * route not in routes.txt is a GTFS foreign_key_violation, so console-created
 * routes (id `manual-…`) that never made it into the vendored feed must be
 * excluded from the overlay. route_id is the first column and its values carry
 * no commas, so splitting on "," is safe even for quoted long-name fields.
 */
async function readBaseRouteIds(baseDir: string): Promise<Set<string>> {
  const content = await readFile(path.join(baseDir, "routes.txt"), "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  const idx = lines[0].split(",").indexOf("route_id");
  if (idx === -1) throw new Error("base routes.txt has no route_id column");
  const ids = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const id = lines[i].split(",")[idx];
    if (id) ids.add(id);
  }
  return ids;
}

/** Prune zip FILES beyond the newest KEEP_ZIPS (DB rows are kept for audit). */
async function pruneOldZips(): Promise<void> {
  const stale = await prisma.feedVersion.findMany({
    orderBy: { version: "desc" },
    skip: KEEP_ZIPS,
    select: { filePath: true },
  });
  await Promise.all(stale.map((v) => unlink(v.filePath).catch(() => {})));
}

export interface GeneratedVersion {
  version: number;
  label: string;
  sizeBytes: number;
  fareChangeCount: number;
  routeCount: number;
}

/**
 * Generate the next feed version: build the zip, write a FeedVersion row
 * (validatorStatus PENDING — the validator gate runs in CI only), and prune
 * old zip files. Synchronous end to end (file copies + two small files).
 */
export async function generateFeedVersion(
  generatedById: string,
): Promise<GeneratedVersion> {
  // Fail loudly if the base feed isn't reachable rather than shipping an
  // empty/partial zip.
  const baseDir = await resolveBaseDir();

  const last = await prisma.feedVersion.findFirst({
    orderBy: { version: "desc" },
    select: { version: true, lastChangeLogId: true },
  });
  const version = (last?.version ?? 0) + 1;
  const label = `v${version}`;

  // Read every fare and let selectFlatFares apply the V1 omission rule (4A) —
  // one tested place decides what reaches the export.
  const fareRows = await prisma.fare.findMany({
    select: { routeId: true, kind: true, flatAmountEtb: true },
  });
  const allFlat = selectFlatFares(
    fareRows.map((f) => ({
      routeId: f.routeId,
      kind: f.kind,
      flatAmountEtb: f.flatAmountEtb?.toNumber() ?? null,
    })),
  );
  // Drop fares for routes absent from the base feed (console-created `manual-…`
  // routes) — referencing them would be a GTFS foreign_key_violation.
  const baseRouteIds = await readBaseRouteIds(baseDir);
  const fares: FlatFare[] = allFlat.filter((f) => baseRouteIds.has(f.routeId));

  await mkdir(EXPORT_DIR, { recursive: true });
  const filePath = path.join(EXPORT_DIR, `dandii-gtfs-${label}.zip`);
  await buildZip(filePath, baseDir, version, fares);
  const { size } = await stat(filePath);

  // Change report cursor: count FareChangeLog rows since the previous version's
  // anchor, and record the newest row's id as this version's anchor.
  const newestLog = await prisma.fareChangeLog.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });
  let fareChangeCount: number;
  if (last?.lastChangeLogId) {
    const cursor = await prisma.fareChangeLog.findUnique({
      where: { id: last.lastChangeLogId },
      select: { createdAt: true },
    });
    fareChangeCount = cursor
      ? await prisma.fareChangeLog.count({
          where: { createdAt: { gt: cursor.createdAt } },
        })
      : await prisma.fareChangeLog.count();
  } else {
    fareChangeCount = await prisma.fareChangeLog.count();
  }

  await prisma.feedVersion.create({
    data: {
      version,
      label,
      filePath,
      sizeBytes: size,
      fareChangeCount,
      generatedById,
      lastChangeLogId: newestLog?.id ?? last?.lastChangeLogId ?? null,
    },
  });

  await pruneOldZips();

  return {
    version,
    label,
    sizeBytes: size,
    fareChangeCount,
    routeCount: fares.length,
  };
}
