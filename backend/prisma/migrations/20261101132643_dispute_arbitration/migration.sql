-- AlterEnum
ALTER TYPE "DisputeStatus" ADD VALUE 'AWAITING_ACCEPTANCE';

-- AlterEnum
ALTER TYPE "MilestoneStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "aiProposal" JSONB,
ADD COLUMN     "appealDeadline" TIMESTAMP(3),
ADD COLUMN     "appealedById" TEXT,
ADD COLUMN     "escalationReason" TEXT,
ADD COLUMN     "evidenceDeadline" TIMESTAMP(3),
ADD COLUMN     "resolutionSource" TEXT,
ADD COLUMN     "resolvedById" TEXT;

-- CreateTable
CREATE TABLE "DisputeEvidence" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'EVIDENCE',
    "content" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DisputeEvidence_disputeId_idx" ON "DisputeEvidence"("disputeId");

-- CreateIndex
CREATE INDEX "Dispute_status_evidenceDeadline_idx" ON "Dispute"("status", "evidenceDeadline");

-- CreateIndex
CREATE INDEX "Dispute_status_appealDeadline_idx" ON "Dispute"("status", "appealDeadline");

-- CreateIndex
CREATE INDEX "Dispute_contractId_idx" ON "Dispute"("contractId");

-- AddForeignKey
ALTER TABLE "DisputeEvidence" ADD CONSTRAINT "DisputeEvidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
