"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { fareSchema, type FareInput } from "./fare-schema";

export async function updateFare(input: FareInput) {
  await requirePermission({ fare: ["update"] });
  const data = fareSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const fare = await tx.fare.upsert({
      where: { routeId: data.routeId },
      create: {
        routeId: data.routeId,
        kind: data.kind,
        flatAmountEtb: data.kind === "FLAT" ? data.flatAmountEtb : null,
      },
      update: {
        kind: data.kind,
        flatAmountEtb: data.kind === "FLAT" ? data.flatAmountEtb : null,
      },
    });
    await tx.fareTier.deleteMany({ where: { fareId: fare.id } });
    if (data.kind === "TIERED") {
      await tx.fareTier.createMany({
        data: data.tiers.map((t) => ({
          fareId: fare.id,
          label: t.label,
          fromKm: t.fromKm,
          toKm: t.toKm,
          amountEtb: t.amountEtb,
        })),
      });
    }
  });

  revalidatePath("/console");
  revalidatePath("/console/fares");
  return { ok: true as const };
}
