-- Add appointmentId to medical_records
ALTER TABLE "medical_records" ADD COLUMN "appointmentId" TEXT;

-- Create unique index for 1:1 relationship
CREATE UNIQUE INDEX "medical_records_appointmentId_key" ON "medical_records"("appointmentId");

-- Add foreign key
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
