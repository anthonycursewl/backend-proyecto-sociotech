# Plan: Workflow de Historia Clínica

## 1. Flujo de usuario (UI)

### 1.1 Appointment Detail (vista del doctor)

```
GET /appointments?filter=pending
↓
Lista de citas pendientes
↓
Tap en una cita → GET /appointments/:id
↓
Appointment Detail Screen
├── Info básica: paciente, fecha, hora, motivo, estado
├── Botón "Historia Clínica"
│     ├── Si NO existe HC → Navega a crear HC (pre-filled con patientId, doctorId, appointmentId)
│     └── Si SÍ existe HC  → Navega a editar HC (si no está firmada) o ver HC (si está firmada)
├── [Confirmar cita]        → PUT /appointments/:id/confirm
└── [Cancelar cita (doctor)] → PUT /appointments/:id/doctor-cancel
```

### 1.2 Medical Record Form / Detail (crear/editar/ver)

**Crear (POST):**
```
POST /medical-records
Body: { patientId, doctorId, appointmentId, chiefComplaint, symptoms[],
        diagnosis, diagnosisCode?, treatment, notes,
        vitalSigns?: { bloodPressure, heartRate, temperature, weight, height, respiratoryRate, oxygenSaturation },
        prescriptions?: [{ medicationName, dosage, frequency, duration, instructions }] }
```

**Editar (PUT) — solo si NO está firmada:**
```
PUT /medical-records/:id
Body: { chiefComplaint?, symptoms?, diagnosis?, diagnosisCode?, treatment?,
        notes?, vitalSigns?, prescriptions? }
```

**Firmar (PUT):**
```
PUT /medical-records/:id/sign
Body: { signed: true }
```
Una vez firmada: inmutable. Ya no se puede editar. Solo lectura.

### 1.3 Patient Medical History (solo lectura)

```
GET /medical-records/patient/:patientId
↓
Lista cronológica de historias clínicas (firmadas y sin firmar)
Cada item muestra: fecha, doctor, diagnóstico, resumen
Tap → GET /medical-records/:id → vista detalle (solo lectura si está firmada)
```

### 1.4 Acceso del paciente

```
GET /appointments/me → detail → GET /medical-records/appointment/:appointmentId
O directamente: GET /medical-records/patient/:patientId
```
El paciente solo ve sus propias HC (`medical-records:read:own`), siempre en modo solo lectura.

---

## 2. Cambios en base de datos (Prisma schema)

### 2.1 MedicalRecord — agregar campos

```prisma
model MedicalRecord {
  // ... campos existentes ...
  chiefComplaint String
  symptoms       String[]
  diagnosis      String
  diagnosisCode  String?          // NUEVO: CIE-10, ej "J03.9"
  treatment      String
  notes          String
  isSigned       Boolean   @default(false)
  signedAt       DateTime?

  // NUEVOS: Signos vitales (todos opcionales)
  bloodPressure       String?   // ej "120/80"
  heartRate           Int?
  temperature         Float?
  weight              Float?    // kg
  height              Float?    // cm
  respiratoryRate     Int?
  oxygenSaturation    Int?      // %

  // ... relaciones existentes ...
  prescriptions   MedicalPrescription[]
  attachments     MedicalRecordAttachment[]
}
```

### 2.2 Nueva tabla: MedicalPrescription

```prisma
model MedicalPrescription {
  id              String   @id @default(uuid())
  medicalRecordId String
  medicationName  String        // "Ibuprofeno"
  dosage          String?       // "400 mg"
  frequency       String?       // "Cada 8 horas"
  duration        String?       // "5 días"
  instructions    String?       // "Tomar después de comer"
  createdAt       DateTime  @default(now())

  medicalRecord   MedicalRecord @relation(fields: [medicalRecordId], references: [id], onDelete: Cascade)

  @@index([medicalRecordId])
  @@map("medical_prescriptions")
}
```

---

## 3. Cambios en el backend

### 3.1 DTOs (medical-record.dto.ts)

**CreateMedicalRecordDto** — agregar:
```typescript
@IsOptional() @IsString()  diagnosisCode?: string;

@IsOptional() @ValidateNested() @Type(() => VitalSignsDto)
vitalSigns?: VitalSignsDto;

@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreatePrescriptionDto)
prescriptions?: CreatePrescriptionDto[];
```

**UpdateMedicalRecordDto** — agregar mismos campos como opcionales.

**Nuevos DTOs:**
```typescript
class VitalSignsDto {
  @IsOptional() @IsString()  bloodPressure?: string;
  @IsOptional() @IsInt()     heartRate?: number;
  @IsOptional() @IsNumber()  temperature?: number;
  @IsOptional() @IsNumber()  weight?: number;
  @IsOptional() @IsNumber()  height?: number;
  @IsOptional() @IsInt()     respiratoryRate?: number;
  @IsOptional() @IsInt()     oxygenSaturation?: number;
}

class CreatePrescriptionDto {
  @IsString() @IsNotEmpty()  medicationName: string;
  @IsOptional() @IsString()  dosage?: string;
  @IsOptional() @IsString()  frequency?: string;
  @IsOptional() @IsString()  duration?: string;
  @IsOptional() @IsString()  instructions?: string;
}
```

**MedicalRecordResponse** — agregar:
```typescript
diagnosisCode?: string;
vitalSigns: VitalSignsResponse | null;
prescriptions: PrescriptionResponse[];
```

### 3.2 Entity (medical-record.entity.ts)

- Agregar `diagnosisCode`, `bloodPressure`, `heartRate`, `temperature`, `weight`, `height`, `respiratoryRate`, `oxygenSaturation`, `prescriptions` a `MedicalRecordProps`
- Agregar getters para cada uno
- `updateContent()` debe incluir los nuevos campos (y seguir rechazando si está firmada)

### 3.3 Repository (prisma-medical-record.repository.ts)

- `defaultInclude()` incluir `prescriptions: true`
- `toDomain()` mapear prescriptions
- `save()` crear prescriptions anidadas
- `update()` actualizar prescriptions (deleteMany + createMany, mismo patrón que PatientAllergy)

### 3.4 Migration

Crear migración:
```sql
ALTER TABLE medical_records ADD COLUMN diagnosis_code VARCHAR(20);
ALTER TABLE medical_records ADD COLUMN blood_pressure VARCHAR(10);
ALTER TABLE medical_records ADD COLUMN heart_rate INTEGER;
ALTER TABLE medical_records ADD COLUMN temperature DOUBLE PRECISION;
ALTER TABLE medical_records ADD COLUMN weight DOUBLE PRECISION;
ALTER TABLE medical_records ADD COLUMN height DOUBLE PRECISION;
ALTER TABLE medical_records ADD COLUMN respiratory_rate INTEGER;
ALTER TABLE medical_records ADD COLUMN oxygen_saturation INTEGER;

CREATE TABLE medical_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_medical_record ON medical_prescriptions(medical_record_id);
```

---

## 4. Matriz de permisos actualizada

| Recurso | Permiso | Roles |
|---|---|---|
| `medical-records:read` | Ver cualquier HC | DOCTOR, ADMIN, SUPER_ADMIN |
| `medical-records:read:own` | Ver propia HC | PATIENT |
| `medical-records:create` | Crear HC | DOCTOR, SUPER_ADMIN |
| `medical-records:update` | Editar HC (no firmada) | DOCTOR, SUPER_ADMIN |
| `medical-records:delete` | Eliminar HC | SUPER_ADMIN |
| `medical-records:sign` | Firmar HC | DOCTOR, SUPER_ADMIN |

---

## 5. Resumen de endpoints

### Existentes (sin cambios)
| Método | Path | Permiso | Uso |
|---|---|---|---|
| `GET` | `/medical-records/:id` | `medical-records:read` | Ver detalle HC |
| `GET` | `/medical-records/patient/:patientId` | `medical-records:read` | Historial del paciente |
| `GET` | `/medical-records/doctor/:doctorId` | `medical-records:read` | HC creadas por un doctor |
| `GET` | `/medical-records/appointment/:appointmentId` | `medical-records:read` | HC de una cita específica |
| `PUT` | `/medical-records/:id/sign` | `medical-records:sign` | Firmar HC |
| `DELETE` | `/medical-records/:id` | `medical-records:delete` | Eliminar HC |

### Con cambios (se extienden)
| Método | Path | Permiso | Cambio |
|---|---|---|---|
| `POST` | `/medical-records` | `medical-records:create` | Body acepta `vitalSigns`, `prescriptions`, `diagnosisCode` |
| `PUT` | `/medical-records/:id` | `medical-records:update` | Body acepta mismos campos nuevos |

---

## 6. Reglas de negocio

| Regla | Comportamiento |
|---|---|
| HC firmada es INMUTABLE | `PUT :id` devuelve `400` si `isSigned = true` |
| Solo 1 HC por cita | `POST` devuelve `400` si ya existe HC con ese `appointmentId` |
| Signos vitales opcionales | Todos los campos son nullable, el doctor decide qué registrar |
| Prescripciones se reemplazan | En `PUT`, se borran las existentes y se crean las nuevas (mismo patrón que alergias) |
| `diagnosisCode` es string libre | No se valida contra un catálogo (por ahora), el doctor escribe el código CIE-10 manualmente |
| Firmar requiere estado válido | `PUT /sign` devuelve `400` si ya está firmada |

---

## 7. UI: Componentes necesarios

| Componente | Ubicación | Props |
|---|---|---|
| `VitalSignsForm` | Medical Record Form | `vitalSigns: VitalSignsData`, `onChange` |
| `VitalSignsView` | Medical Record View (read-only) | `vitalSigns: VitalSignsData` |
| `PrescriptionList` | Ambas pantallas | `prescriptions[]`, `editable` |
| `PrescriptionForm` | Medical Record Form | `onAdd`, `onRemove` |
| `DiagnosisCodeInput` | Medical Record Form | `value: string`, `onChange` |
| `AppointmentCard` (con HC status) | Appointment List | `appointment`, `hasMedicalRecord` |

---

## 8. Orden de implementación

1. **Prisma schema** → agregar campos + nueva tabla
2. **Migración** → SQL manual (porque `prisma migrate dev` falla en CI)
3. **Entity** → agregar props + getters + actualizar `updateContent()`
4. **Repository** → incluir prescriptions en queries + CRUD
5. **DTOs** → VitalSignsDto, PrescriptionDto, actualizar Create/Update DTOs
6. **Service** → manejar vitalSigns + prescriptions en create/update
7. **Build + tests** → verificar que todo compila y tests pasan
8. **Seed RBAC** → `npm run seed:rbac` (si hay cambios de permisos)
