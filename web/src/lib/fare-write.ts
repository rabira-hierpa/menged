import { Prisma } from "@/generated/prisma/client";
import type { FareChangeSource, FareKind } from "@/generated/prisma/enums";
import type { tierSchema } from "@/actions/fare-schema";
import type { z } from "zod";

type TierInput = z.infer<typeof tierSchema>;

/** Normalized new-fare payload shared by every fare-write path. */
export type FareData =
  | { kind: "FLAT"; flatAmountEtb: number }
  | { kind: "TIERED"; tiers: TierInput[] };

interface ChangeMeta {
  source: FareChangeSource;
  changedById: string;
  /** Set when the write comes from approving a proposal. */
  proposalId?: string;
}

function toTierJson(tiers: TierInput[]): Prisma.InputJsonValue {
  return tiers.map((t) => ({
    label: t.label,
    fromKm: t.fromKm,
    toKm: t.toKm,
    amountEtb: t.amountEtb,
  })) as unknown as Prisma.InputJsonValue;
}

/**
 * The single fare-write path: upserts a route's fare, replaces its tiers, and
 * appends one FareChangeLog row capturing the before/after image. Every fare
 * mutation — console edit, bulk edit, proposal approval — goes through here, so
 * no write can silently skip the audit trail (design-review T1).
 *
 * PERMISSION-FREE BY DESIGN: the caller does the permission check. Maintainers
 * hold `fare: ["read"]` only; if this helper carried a `fare: update` gate,
 * every proposal approval would 403 (outside voice #5).
 */
export async function applyFareChange(
  tx: Prisma.TransactionClient,
  routeId: string,
  data: FareData,
  meta: ChangeMeta,
): Promise<void> {
  // Before-image for the audit trail.
  const existing = await tx.fare.findUnique({
    where: { routeId },
    include: { tiers: { orderBy: { fromKm: "asc" } } },
  });

  const fare = await tx.fare.upsert({
    where: { routeId },
    create: {
      routeId,
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

  await tx.fareChangeLog.create({
    data: {
      routeId,
      proposalId: meta.proposalId ?? null,
      changedById: meta.changedById,
      source: meta.source,
      beforeKind: (existing?.kind as FareKind | undefined) ?? null,
      beforeFlatEtb: existing?.flatAmountEtb ?? null,
      beforeTiers: existing
        ? toTierJson(
            existing.tiers.map((t) => ({
              label: t.label,
              fromKm: t.fromKm,
              toKm: t.toKm,
              amountEtb: t.amountEtb.toNumber(),
            })),
          )
        : Prisma.JsonNull,
      afterKind: data.kind,
      afterFlatEtb: data.kind === "FLAT" ? data.flatAmountEtb : null,
      afterTiers: data.kind === "TIERED" ? toTierJson(data.tiers) : Prisma.JsonNull,
    },
  });
}
