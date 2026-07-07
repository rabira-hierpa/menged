import { z } from "zod";
import { CLOSURE_REASONS } from "@/lib/operators";

export const closureSchema = z
  .object({
    routeId: z.string().min(1),
    reason: z.enum(CLOSURE_REASONS),
    note: z.string().max(500).optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "End must be after start",
    path: ["endsAt"],
  });

export type ClosureInput = z.infer<typeof closureSchema>;
