-- CreateTable
CREATE TABLE "patient_metrics" (
    "id" TEXT NOT NULL,
    "totalActive" INTEGER NOT NULL DEFAULT 0,
    "totalInactive" INTEGER NOT NULL DEFAULT 0,
    "totalNew" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_metrics_pkey" PRIMARY KEY ("id")
);
