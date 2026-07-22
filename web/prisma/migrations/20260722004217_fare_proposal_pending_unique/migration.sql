-- One PENDING proposal per (route, user). Prisma can't express partial
-- uniques natively, so it's a raw index: a rider can't spam the same route
-- with multiple open proposals, but past (decided) proposals don't block a
-- new one.
CREATE UNIQUE INDEX "fare_proposal_one_pending_per_user_route"
  ON "fare_proposal" ("routeId", "submittedById")
  WHERE "status" = 'PENDING';
