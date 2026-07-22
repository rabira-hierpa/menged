-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "FareChangeSource" AS ENUM ('PROPOSAL_APPROVAL', 'CONSOLE_EDIT', 'RESEED');

-- CreateEnum
CREATE TYPE "ValidatorStatus" AS ENUM ('PENDING', 'PASS', 'WARN', 'FAIL');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "lastSubmissionsViewedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "fare_proposal" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "proposedKind" "FareKind" NOT NULL,
    "proposedFlatEtb" DECIMAL(8,2),
    "proposedTiers" JSONB,
    "baselineKind" "FareKind",
    "baselineFlatEtb" DECIMAL(8,2),
    "baselineTiers" JSONB,
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fare_proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_route" (
    "userId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_route_pkey" PRIMARY KEY ("userId","routeId")
);

-- CreateTable
CREATE TABLE "fare_change_log" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "proposalId" TEXT,
    "changedById" TEXT NOT NULL,
    "source" "FareChangeSource" NOT NULL,
    "beforeKind" "FareKind",
    "beforeFlatEtb" DECIMAL(8,2),
    "beforeTiers" JSONB,
    "afterKind" "FareKind",
    "afterFlatEtb" DECIMAL(8,2),
    "afterTiers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fare_change_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_version" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "fareChangeCount" INTEGER NOT NULL DEFAULT 0,
    "generatedById" TEXT NOT NULL,
    "validatorStatus" "ValidatorStatus" NOT NULL DEFAULT 'PENDING',
    "validatorReport" JSONB,
    "lastChangeLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fare_proposal_routeId_status_idx" ON "fare_proposal"("routeId", "status");

-- CreateIndex
CREATE INDEX "fare_proposal_submittedById_createdAt_idx" ON "fare_proposal"("submittedById", "createdAt");

-- CreateIndex
CREATE INDEX "saved_route_userId_idx" ON "saved_route"("userId");

-- CreateIndex
CREATE INDEX "fare_change_log_routeId_createdAt_idx" ON "fare_change_log"("routeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "feed_version_version_key" ON "feed_version"("version");

-- AddForeignKey
ALTER TABLE "fare_proposal" ADD CONSTRAINT "fare_proposal_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_route" ADD CONSTRAINT "saved_route_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fare_change_log" ADD CONSTRAINT "fare_change_log_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
