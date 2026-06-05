-- Add vital signs fields to medical_records
ALTER TABLE medical_records
  ADD COLUMN IF NOT EXISTS diagnosis_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS blood_pressure VARCHAR(10),
  ADD COLUMN IF NOT EXISTS heart_rate INTEGER,
  ADD COLUMN IF NOT EXISTS temperature DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS weight DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS height DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS respiratory_rate INTEGER,
  ADD COLUMN IF NOT EXISTS oxygen_saturation INTEGER;

-- Create medical_prescriptions table
CREATE TABLE IF NOT EXISTS medical_prescriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  medical_record_id TEXT NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_medical_record ON medical_prescriptions(medical_record_id);
