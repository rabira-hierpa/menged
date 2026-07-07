"use server";

import { revalidatePath } from "next/cache";
import { MAINTAINER_REASONS } from "@/lib/operators";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { closureSchema, type ClosureInput } from "./closure-schema";

function revalidateConsole() {
  revalidatePath("/console");
  revalidatePath("/console/routes");
  revalidatePath("/console/network");
  revalidatePath("/api/geo/routes");
}

export async function createClosure(input: ClosureInput) {
  const session = await requirePermission({ closure: ["create"] });
  const data = closureSchema.parse(input);

  // Maintainers may only close for MAINTENANCE/OTHER.
  const role = session.user.role ?? "user";
  if (role === "maintainer" && !MAINTAINER_REASONS.includes(data.reason)) {
    return {
      ok: false as const,
      error: "Maintainers can only create maintenance or other closures",
    };
  }

  await prisma.routeClosure.create({
    data: {
      routeId: data.routeId,
      reason: data.reason,
      note: data.note || null,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      createdById: session.user.id,
    },
  });

  revalidateConsole();
  return { ok: true as const };
}

/** Ends an active closure now (reopens the route). */
export async function endClosure(closureId: string) {
  await requirePermission({ closure: ["update"] });

  const closure = await prisma.routeClosure.findUnique({
    where: { id: closureId },
  });
  if (!closure) return { ok: false as const, error: "Closure not found" };

  await prisma.routeClosure.update({
    where: { id: closureId },
    data: { endsAt: new Date() },
  });

  revalidateConsole();
  return { ok: true as const };
}
