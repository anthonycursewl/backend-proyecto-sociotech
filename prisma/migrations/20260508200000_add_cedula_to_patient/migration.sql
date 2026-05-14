-- Add cedula to patients
ALTER TABLE "patients" ADD COLUMN "cedula" TEXT;
CREATE UNIQUE INDEX "patients_cedula_key" ON "patients"("cedula");
