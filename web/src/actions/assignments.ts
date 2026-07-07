"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

const assignSchema = z.object({
  routeId: z.string().min(1),
  operatorId: z.string().min(1),
});

export async function assignRoute(input: z.infer<typeof assignSchema>) {
  const session = await requirePermission({ route: ["assign"] });
  const { routeId, operatorId } = assignSchema.parse(input);

  const operator = await prisma.operator.findUnique({
    where: { id: operatorId },
  });
  if (!operator) {
    return { ok: false as const, error: "Unknown operator" };
  }

  await prisma.routeAssignment.upsert({
    where: { routeId },
    create: { routeId, operatorId, assignedById: session.user.id },
    update: {
      operatorId,
      assignedById: session.user.id,
      assignedAt: new Date(),
    },
  });

  revalidatePath("/console");
  revalidatePath("/console/routes");
  revalidatePath("/console/network");
  return { ok: true as const, operatorName: operator.name };
}
