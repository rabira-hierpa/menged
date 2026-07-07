-- CreateEnum
CREATE TYPE "OperatorCode" AS ENUM ('ANBESSA', 'SHEGER', 'ALLIANCE', 'MINIBUS', 'LRT');

-- CreateEnum
CREATE TYPE "FareKind" AS ENUM ('FLAT', 'TIERED');

-- CreateEnum
CREATE TYPE "ClosureReason" AS ENUM ('PUBLIC_HOLIDAY', 'MAINTENANCE', 'POLITICAL_EVENT', 'OTHER');

-- CreateTable
CREATE TABLE "agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "timezone" TEXT,

    CONSTRAINT "agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator" (
    "id" TEXT NOT NULL,
    "code" "OperatorCode" NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,

    CONSTRAINT "operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route" (
    "id" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "longName" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "color" TEXT,
    "textColor" TEXT,
    "agencyId" TEXT NOT NULL,
    "geojson" JSONB,
    "geojsonSimplified" JSONB,
    "lengthMeters" DOUBLE PRECISION,

    CONSTRAINT "route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "shapeId" TEXT,
    "headsign" TEXT,

    CONSTRAINT "trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stop_time" (
    "tripId" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "arrival" TEXT,
    "departure" TEXT,

    CONSTRAINT "stop_time_pkey" PRIMARY KEY ("tripId","sequence")
);

-- CreateTable
CREATE TABLE "frequency" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "headwaySecs" INTEGER NOT NULL,

    CONSTRAINT "frequency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar" (
    "serviceId" TEXT NOT NULL,
    "monday" BOOLEAN NOT NULL,
    "tuesday" BOOLEAN NOT NULL,
    "wednesday" BOOLEAN NOT NULL,
    "thursday" BOOLEAN NOT NULL,
    "friday" BOOLEAN NOT NULL,
    "saturday" BOOLEAN NOT NULL,
    "sunday" BOOLEAN NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,

    CONSTRAINT "calendar_pkey" PRIMARY KEY ("serviceId")
);

-- CreateTable
CREATE TABLE "fare" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "kind" "FareKind" NOT NULL,
    "flatAmountEtb" DECIMAL(8,2),
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fare_tier" (
    "id" TEXT NOT NULL,
    "fareId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fromKm" DOUBLE PRECISION NOT NULL,
    "toKm" DOUBLE PRECISION,
    "amountEtb" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "fare_tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_closure" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "reason" "ClosureReason" NOT NULL,
    "note" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_closure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_assignment" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "operator_code_key" ON "operator"("code");

-- CreateIndex
CREATE INDEX "route_shortName_idx" ON "route"("shortName");

-- CreateIndex
CREATE INDEX "stop_name_idx" ON "stop"("name");

-- CreateIndex
CREATE INDEX "trip_routeId_idx" ON "trip"("routeId");

-- CreateIndex
CREATE INDEX "stop_time_stopId_idx" ON "stop_time"("stopId");

-- CreateIndex
CREATE INDEX "frequency_tripId_idx" ON "frequency"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "fare_routeId_key" ON "fare"("routeId");

-- CreateIndex
CREATE INDEX "fare_tier_fareId_idx" ON "fare_tier"("fareId");

-- CreateIndex
CREATE INDEX "route_closure_routeId_startsAt_endsAt_idx" ON "route_closure"("routeId", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "route_assignment_routeId_key" ON "route_assignment"("routeId");

-- CreateIndex
CREATE INDEX "route_assignment_operatorId_idx" ON "route_assignment"("operatorId");

-- AddForeignKey
ALTER TABLE "route" ADD CONSTRAINT "route_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_time" ADD CONSTRAINT "stop_time_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_time" ADD CONSTRAINT "stop_time_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "stop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequency" ADD CONSTRAINT "frequency_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fare" ADD CONSTRAINT "fare_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fare_tier" ADD CONSTRAINT "fare_tier_fareId_fkey" FOREIGN KEY ("fareId") REFERENCES "fare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_closure" ADD CONSTRAINT "route_closure_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_assignment" ADD CONSTRAINT "route_assignment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_assignment" ADD CONSTRAINT "route_assignment_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
