-- Add serviceId and timeSlot to appointments, add doctor_schedules table
ALTER TABLE "appointments" ADD COLUMN "serviceId" TEXT;
ALTER TABLE "appointments" ADD COLUMN "timeSlot" TEXT;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT;
CREATE INDEX "appointments_serviceId_idx" ON "appointments"("serviceId");
CREATE INDEX "appointments_doctorId_scheduledAt_idx" ON "appointments"("doctorId", "scheduledAt");
CREATE TABLE "doctor_schedules" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "doctorId" UUID NOT NULL, "dayOfWeek" INT NOT NULL, "startTime" TEXT NOT NULL, "endTime" TEXT NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "doctor_schedules_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "doctor_schedules_doctorId_dayOfWeek_key" ON "doctor_schedules"("doctorId", "dayOfWeek");
CREATE INDEX "doctor_schedules_doctorId_idx" ON "doctor_schedules"("doctorId");
ALTER TABLE "doctor_schedules" ADD CONSTRAINT "doctor_schedules_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE;