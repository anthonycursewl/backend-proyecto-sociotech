-- Rename existing audit_logs to preserve data
ALTER TABLE IF EXISTS "audit_logs" RENAME TO "audit_logs_old";

-- Drop primary key on old table (will be recreated on partitioned)
ALTER TABLE "audit_logs_old" DROP CONSTRAINT IF EXISTS "audit_logs_pkey";

-- Create new audit_logs as partitioned table
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id", "timestamp")
) PARTITION BY RANGE ("timestamp");

-- Create partition for current year (2026)
CREATE TABLE "audit_logs_2026" PARTITION OF "audit_logs"
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Create partition for next year (2027)
CREATE TABLE "audit_logs_2027" PARTITION OF "audit_logs"
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

-- Create default partition for data outside defined ranges
CREATE TABLE "audit_logs_default" PARTITION OF "audit_logs" DEFAULT;

-- Migrate existing data
INSERT INTO "audit_logs" (id, "userId", action, "entityType", "entityId", "oldValues", "newValues", "ipAddress", "userAgent", timestamp)
SELECT id, "userId", action, "entityType", "entityId", "oldValues", "newValues", "ipAddress", "userAgent", timestamp
FROM "audit_logs_old";

-- Drop the old table
DROP TABLE IF EXISTS "audit_logs_old";

-- Recreate indexes on parent (which will propagate to partitions)
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

