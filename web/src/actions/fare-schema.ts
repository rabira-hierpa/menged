import { z } from "zod";

export const tierSchema = z.object({
  label: z.string().min(1, "Label is required"),
  fromKm: z.number().min(0),
  toKm: z.number().min(0).nullable(),
  amountEtb: z.number().min(0, "Amount must be ≥ 0"),
});

export const fareSchema = z.discriminatedUnion("kind", [
  z.object({
    routeId: z.string().min(1),
    kind: z.literal("FLAT"),
    flatAmountEtb: z.number().min(0, "Amount must be ≥ 0"),
  }),
  z.object({
    routeId: z.string().min(1),
    kind: z.literal("TIERED"),
    tiers: z.array(tierSchema).min(1, "At least one tier"),
  }),
]);

export type FareInput = z.infer<typeof fareSchema>;
