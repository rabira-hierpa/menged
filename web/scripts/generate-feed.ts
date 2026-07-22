/**
 * CI helper: build one fares-overlay GTFS version from the seeded database and
 * print its metadata as JSON. The validator gate then runs the MobilityData
 * validator on the resulting zip. Run with: `npx tsx scripts/generate-feed.ts`.
 */
import { generateFeedVersion } from "@/lib/gtfs-export";
import { prisma } from "@/lib/prisma";

async function main() {
  const result = await generateFeedVersion("ci");
  console.log(JSON.stringify(result));
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
