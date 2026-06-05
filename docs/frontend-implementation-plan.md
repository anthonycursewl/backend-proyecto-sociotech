# Plan Frontend — Módulo de Historias Clínicas

Basado en el workflow documentado en `docs/medical-record-workflow.md`

---

## 1. Flujo de Usuario (UI)

### 1.1 Appointment Detail → HC (vista del doctor)

```
GET /appointments?filter=pending
  ↓
Lista de citas pendientes
  ↓
Tap en una cita → GET /appointments/:id
  ↓
Pantalla: Appointment Detail
├── Info: paciente, fecha, hora, motivo, estado
├── Botón "Historia Clínica"
│     ├── GET /medical-records/appointment/:appointmentId
│     │     ├── Si resp = null  → Navegar a crear HC
│     │     │     POST /medical-records
│     │     │     (pre-filled: patientId, doctorId, appointmentId)
│     │     ├── Si resp.isSigned = false → Navegar a editar HC
│     │     │     PUT /medical-records/:id
│     │     └── Si resp.isSigned = true  → Navegar a ver HC (solo lectura)
│     │           GET /medical-records/:id
├── Botón [Confirmar cita]   → PUT /appointments/:id/confirm
└── Botón [Cancelar cita]    → PUT /appointments/:id/doctor-cancel
```

### 1.2 Medical Record — Crear / Editar / Ver

**Crear (POST):**
```
Pantalla: Medical Record Form
├── Sección: Datos de consulta
│     ├── chiefComplaint (textarea, req)
│     ├── symptoms (tags input, req)
│     └── notes (textarea, req)
├── Sección: Diagnóstico
│     ├── diagnosis (textarea, req)
│     └── diagnosisCode (input, opc) — código CIE-10 ej "J03.9"
├── Sección: Tratamiento
│     └── treatment (textarea, req)
├── Sección: Signos Vitales (VitalSignsForm, todos opcionales)
│     ├── bloodPressure  → "120/80" (string)
│     ├── heartRate      → latidos/min (number)
│     ├── temperature    → °C (number)
│     ├── weight         → kg (number)
│     ├── height         → cm (number)
│     ├── respiratoryRate → resp/min (number)
│     └── oxygenSaturation → % (number, 0-100)
├── Sección: Recetas (PrescriptionForm + PrescriptionList)
│     └── Lista de recetas, cada una:
│           ├── medicationName (input, req)
│           ├── dosage (input, opc) → "400 mg"
│           ├── frequency (input, opc) → "Cada 8 horas"
│           ├── duration (input, opc) → "5 días"
│           └── instructions (textarea, opc) → "Tomar después de comer"
└── Botón [Guardar]  → POST /medical-records
```

**Editar (PUT):** Misma pantalla, campos pre-cargados desde `GET /medical-records/:id`. Solo disponible si `isSigned = false`.

**Ver (GET):** Misma pantalla pero en modo solo lectura. Botón [Firmar] si `isSigned = false`. Si `isSigned = true`, se muestra badge "Firmada" y todo es read-only.

### 1.3 Patient Medical History

```
GET /medical-records/patient/:patientId
  ↓
Lista cronológica de HC (firmadas y sin firmar)
Cada item: fecha, doctor, diagnóstico, resumen, estado (firmada/no firmada)
  ↓
Tap → GET /medical-records/:id → vista detalle
```

### 1.4 Acceso del Paciente

```
GET /appointments/me → detail → GET /medical-records/appointment/:appointmentId
```
El paciente solo ve en modo lectura.

---

## 2. Contratos de API — Medical Records

### 2.1 POST /medical-records

**Permiso:** `medical-records:create` (DOCTOR, SUPER_ADMIN)

**Request Body:**
```typescript
{
  patientId: string;          // UUID requerido
  doctorId: string;           // UUID requerido
  appointmentId?: string;     // UUID opcional

  chiefComplaint: string;     // requerido — motivo de consulta
  symptoms: string[];         // requerido — array de síntomas
  diagnosis: string;          // requerido
  diagnosisCode?: string;     // opcional — código CIE-10 ej "J03.9"
  treatment: string;          // requerido
  notes: string;              // requerido

  vitalSigns?: {              // TODOS opcionales
    bloodPressure?: string;   // "120/80"
    heartRate?: number;       // 72
    temperature?: number;     // 36.5
    weight?: number;          // 70.0 (kg)
    height?: number;          // 170.0 (cm)
    respiratoryRate?: number; // 16
    oxygenSaturation?: number;// 98
  };

  prescriptions?: Array<{     // opcional, array de recetas
    medicationName: string;   // requerido
    dosage?: string;          // "400 mg"
    frequency?: string;       // "Cada 8 horas"
    duration?: string;        // "5 días"
    instructions?: string;    // "Tomar después de comer"
  }>;
}
```

**Response:** `MedicalRecordResponse` (ver sección 2.5)

**Errores:**
- `400` si ya existe HC con ese `appointmentId`
- `404` si doctor no encontrado

### 2.2 PUT /medical-records/:id

**Permiso:** `medical-records:update` (DOCTOR, SUPER_ADMIN)

**Request Body:** Mismos campos que POST, todos opcionales
```typescript
{
  chiefComplaint?: string;
  symptoms?: string[];
  diagnosis?: string;
  diagnosisCode?: string;
  treatment?: string;
  notes?: string;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  prescriptions?: Array<{
    medicationName: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }>;
}
```

**Response:** `MedicalRecordResponse`

**Errores:**
- `400` si `isSigned = true` (inmutable)
- `404` si no existe

### 2.3 PUT /medical-records/:id/sign

**Permiso:** `medical-records:sign` (DOCTOR, SUPER_ADMIN)

**Request Body:**
```typescript
{ signed: true }
```

**Response:** `MedicalRecordResponse`

**Errores:**
- `400` si ya está firmada

### 2.4 GET /medical-records/:id

**Permiso:** `medical-records:read` (DOCTOR, ADMIN, SUPER_ADMIN)

**Response:** `MedicalRecordResponse`

### 2.5 GET /medical-records/patient/:patientId

**Permiso:** `medical-records:read` (DOCTOR, ADMIN, SUPER_ADMIN) o `medical-records:read:own` (PATIENT)

**Response:** `MedicalRecordResponse[]` — ordenado por `createdAt` descendente

### 2.6 GET /medical-records/doctor/:doctorId

**Permiso:** `medical-records:read`

**Response:** `MedicalRecordResponse[]`

### 2.7 GET /medical-records/appointment/:appointmentId

**Permiso:** `medical-records:read` (DOCTOR, ADMIN, SUPER_ADMIN)

**Response:** `MedicalRecordResponse | null`

### 2.7.1 GET /medical-records/me ⭐ NUEVO

**Permiso:** `medical-records:read:own` (PATIENT)

**Path:** `/medical-records/me`

**Descripción:** Retorna todas las historias clínicas del paciente autenticado. Resuelve el `patientId` a partir del `userId` del JWT (no requiere parámetro en URL).

**Response:** `MedicalRecordResponse[]` — ordenado por `createdAt` descendente

**Errores:**
- `404` "Patient profile not found" si el usuario no tiene perfil de paciente (debe hacer `POST /patients/me` primero)

**Caso de uso:** Paciente abre su dashboard → "Mi Historial Clínico" → ve todas sus HC en una lista cronológica sin tener que pasar por cada cita.

### 2.8 DELETE /medical-records/:id

**Permiso:** `medical-records:delete` (solo SUPER_ADMIN)

**Response:** `200 vacío`

### 2.9 MedicalRecordResponse (completo)

```typescript
{
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string | null;

  chiefComplaint: string;
  symptoms: string[];
  diagnosis: string;
  diagnosisCode: string | null;     // código CIE-10
  treatment: string;
  notes: string;

  isSigned: boolean;
  signedAt: string | null;           // ISO string

  // Signos vitales (todos null si no registrados)
  bloodPressure: string | null;      // "120/80"
  heartRate: number | null;          // 72
  temperature: number | null;        // 36.5
  weight: number | null;             // 70.0 (kg)
  height: number | null;             // 170.0 (cm)
  respiratoryRate: number | null;    // 16
  oxygenSaturation: number | null;   // 98 (%)

  // Recetas
  prescriptions: Array<{
    id: string;
    medicalRecordId: string;
    medicationName: string;
    dosage: string | null;           // "400 mg"
    frequency: string | null;        // "Cada 8 horas"
    duration: string | null;         // "5 días"
    instructions: string | null;     // "Tomar después de comer"
    createdAt: string;               // ISO string
  }>;

  createdAt: string;                 // ISO string
  updatedAt: string;                 // ISO string
}
```

---

## 3. Endpoints de Apoyo (Appointment Detail)

Solo los necesarios para el flujo de HC, no se documenta el módulo completo:

```
# Detalle de cita (para obtener patientId, doctorId, appointmentId)
GET /appointments/:id
Headers: Authorization: Bearer <token>
Resp: AppointmentResponseDto
  └── id, patientId, doctorId, serviceId, scheduledAt, timeSlot,
      status, reason, notes, doctor: { id, firstName, lastName,
      specialty }, service: { id, name, durationMin }

# Confirmar cita (antes de crear HC)
PUT /appointments/:id/confirm
Permiso: appointments:update
Body: (ninguno)

# Cancelar cita (doctor)
PUT /appointments/:id/doctor-cancel
Permiso: appointments:cancel
Body: { reason?: string }
```

---

## 4. Reglas de Negocio

| Regla | Comportamiento |
|---|---|
| **HC firmada es INMUTABLE** | `PUT /medical-records/:id` devuelve `400` si `isSigned = true`. UI debe ocultar botón Editar. |
| **Solo 1 HC por cita** | `POST` devuelve `400` si ya existe HC con ese `appointmentId`. Consultar `GET /medical-records/appointment/:appointmentId` primero. |
| **Signos vitales opcionales** | Todos los campos son nullable. El doctor decide qué registrar. UI debe mostrar inputs con placeholder y permitir vacío. |
| **Prescripciones se reemplazan** | En `PUT`, el backend borra todas las existentes y crea las nuevas. UI debe enviar el array completo, no parches. |
| **diagnosisCode es string libre** | No hay catálogo aún. El doctor escribe código CIE-10 manualmente. Input de texto simple. |
| **Firmar es irreversible** | `PUT /sign` devuelve `400` si ya está firmada. Mostrar confirmación antes de firmar. |

---

## 5. Componentes UI Necesarios

| Componente | Ubicación | Props | Descripción |
|---|---|---|---|
| **MedicalRecordForm** | Pantalla crear/editar HC | `initialData?: MedicalRecordResponse`, `onSubmit`, `loading` | Formulario completo que integra todos los subcomponentes |
| **MedicalRecordView** | Pantalla ver HC | `record: MedicalRecordResponse` | Versión solo lectura del formulario |
| **VitalSignsForm** | Dentro de MedicalRecordForm | `vitalSigns: VitalSignsData`, `onChange` | 7 inputs para signos vitales con validación (`@IsInt` para heartRate/respiratoryRate/oxygenSaturation, `@IsNumber` para temperature/weight/height, `@IsString` para bloodPressure) |
| **VitalSignsView** | Dentro de MedicalRecordView | `vitalSigns: VitalSignsData` | Display read-only de signos vitales |
| **PrescriptionForm** | Dentro de MedicalRecordForm | `onAdd: (prescription) => void` | Formulario para agregar una receta (medicationName req + 4 opcionales) |
| **PrescriptionList** | MedicalRecordForm y MedicalRecordView | `prescriptions: PrescriptionData[]`, `editable: boolean`, `onRemove?: (index) => void` | Lista de recetas con opción de eliminar si editable |
| **DiagnosisCodeInput** | Dentro de MedicalRecordForm | `value: string`, `onChange` | Input simple para código CIE-10 |
| **AppointmentDetail** | Pantalla principal | `appointmentId: string` | Muestra info de cita + botón HC + botones confirmar/cancelar |
| **PatientHistoryList** | Pantalla historial paciente | `patientId: string` | Lista cronológica de HC del paciente |

---

## 6. Tipos Compartidos (Frontend)

```typescript
// --- Enums ---
type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

// --- Signos Vitales ---
interface VitalSignsData {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

// --- Receta ---
interface PrescriptionData {
  medicationName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

// --- Response ---
interface MedicalRecordResponse {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string | null;
  chiefComplaint: string;
  symptoms: string[];
  diagnosis: string;
  diagnosisCode: string | null;
  treatment: string;
  notes: string;
  isSigned: boolean;
  signedAt: string | null;
  bloodPressure: string | null;
  heartRate: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  prescriptions: PrescriptionResponse[];
  createdAt: string;
  updatedAt: string;
}

interface PrescriptionResponse {
  id: string;
  medicalRecordId: string;
  medicationName: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  createdAt: string;
}

interface AppointmentResponse {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  timeSlot: string;
  durationMinutes: number;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  cancellation: {
    cancelledAt: string;
    cancelledBy: string;
    cancellationReason: string | null;
  } | null;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    specialty: string;
    phoneNumber: string | null;
  } | null;
  service: {
    id: string;
    name: string;
    description: string | null;
    durationMin: number;
    price: number | null;
  } | null;
}
```

---

## 7. Ruta de Implementación por Fases

Dividido en **4 fases** con entregables verificables. Cada fase termina con un demo funcional que se puede probar end-to-end.

---

### **Fase 0 — Cimientos** (1-2 días)

Setup base compartido que usan todas las pantallas del módulo.

| # | Tarea | Entregable |
|---|---|---|
| 0.1 | Definir tipos TypeScript (sección 6) en `types/medical-records.ts` | Tipos exportados sin errores |
| 0.2 | Configurar cliente HTTP (axios/fetch) con interceptor JWT + refresh automático | Helper `apiClient` listo |
| 0.3 | Crear API service layer en `services/medicalRecordsApi.ts` con las funciones: `createMedicalRecord`, `updateMedicalRecord`, `getMedicalRecord`, `signMedicalRecord`, `getMyMedicalRecords`, `getMedicalRecordsByPatient`, `getMedicalRecordByAppointment` | 7 funciones exportadas, cada una con su tipo de request/response |
| 0.4 | Hook genérico de loading/error: `useApiCall(fn)` o usar `react-query`/`swr` | Hook reutilizable |

**Verificación:** Llamar a `getMyMedicalRecords()` desde un botón de prueba y ver la respuesta en consola.

---

### **Fase 1 — Doctor crea/ve HC desde cita** (3-4 días)

El flujo core: doctor atiende cita → crea o consulta la HC. Sin historial, sin búsqueda, solo desde cita.

| # | Tarea | Componente/Pantalla |
|---|---|---|
| 1.1 | Componente `VitalSignsForm` (inputs con validación) | Reutilizable en crear/editar |
| 1.2 | Componente `VitalSignsView` (read-only) | Reutilizable en detalle |
| 1.3 | Componente `PrescriptionForm` (agregar receta) | Reutilizable |
| 1.4 | Componente `PrescriptionList` (lista + botón eliminar si editable) | Reutilizable |
| 1.5 | Componente `DiagnosisCodeInput` (input simple) | Reutilizable |
| 1.6 | Componente `MedicalRecordForm` (integra 1.1-1.5, maneja estado del form) | Reutilizable en crear/editar |
| 1.7 | Componente `MedicalRecordView` (read-only con badge "Firmada") | Reutilizable |
| 1.8 | Pantalla `MedicalRecordCreate` (recibe `appointmentId` pre-filled, llama POST) | Ruta: `/appointments/:appointmentId/medical-record/new` |
| 1.9 | Pantalla `MedicalRecordEdit` (pre-carga con GET, llama PUT) | Ruta: `/medical-records/:id/edit` |
| 1.10 | Pantalla `MedicalRecordDetail` (modo lectura + botón Firmar si no firmada) | Ruta: `/medical-records/:id` |
| 1.11 | Botón "Historia Clínica" en `AppointmentDetail` (consulta `getMedicalRecordByAppointment` y decide a qué pantalla navegar) | Integración en pantalla existente |

**Lógica del botón HC en AppointmentDetail:**
```typescript
const existing = await getMedicalRecordByAppointment(appointmentId);
if (!existing) {
  // No existe → Crear
  navigate(`/appointments/${appointmentId}/medical-record/new`);
} else if (existing.isSigned) {
  // Existe y firmada → Solo ver
  navigate(`/medical-records/${existing.id}`);
} else {
  // Existe y NO firmada → Editar
  navigate(`/medical-records/${existing.id}/edit`);
}
```

**Verificación (demo):** Doctor inicia sesión → va a citas pendientes → tap en cita → tap "Historia Clínica" → llena form (síntomas, diagnóstico, signos vitales, 2 recetas) → guarda → ve la HC creada → la edita → la firma → intenta editar de nuevo y aparece error 400 "Cannot update a signed medical record".

---

### **Fase 2 — Paciente ve su historial** (1-2 días)

Usar el nuevo endpoint `GET /medical-records/me`.

| # | Tarea | Componente/Pantalla |
|---|---|---|
| 2.1 | Pantalla `MyMedicalHistory` (lista cronológica, modo lectura) | Ruta: `/my-medical-history` |
| 2.2 | Cada item de la lista muestra: fecha, doctor (nombre + especialidad), diagnóstico, badge "Firmada"/"Sin firmar" | UI de la lista |
| 2.3 | Tap en item → navegar a `MedicalRecordDetail` (reutilizar componente de Fase 1) | Integración |
| 2.4 | Agregar link "Mi Historial Clínico" en el menú/dashboard del paciente | UI del dashboard |

**Verificación (demo):** Paciente inicia sesión → ve su dashboard → tap en "Mi Historial Clínico" → ve lista de HC (si tiene) → tap en una → ve detalle en modo lectura. Si el paciente no tiene perfil, mostrar mensaje "Aún no tienes perfil de paciente" con link a crearlo.

---

### **Fase 3 — Doctor busca paciente y ve su historial** (2-3 días)

Flujo inverso: doctor entra sin contexto de cita, busca un paciente y ve todas sus HC.

| # | Tarea | Componente/Pantalla |
|---|---|---|
| 3.1 | Pantalla `PatientSearch` (input de búsqueda + lista de resultados usando `GET /patients/search?q=`) | Ruta: `/patients/search` |
| 3.2 | Pantalla `PatientProfile` (info del paciente + tabs) | Ruta: `/patients/:patientId` |
| 3.3 | Tab "Historial Clínico" dentro de `PatientProfile` — lista cronológica usando `GET /medical-records/patient/:patientId` | Componente en la pantalla |
| 3.4 | Tap en HC del paciente → navegar a `MedicalRecordDetail` (reutilizar de Fase 1) | Integración |
| 3.5 | Botón "Crear Historia Clínica" en `PatientProfile` (para HC sin cita) → abre `MedicalRecordCreate` con `patientId` pre-filled, sin `appointmentId` | Integración |
| 3.6 | Pantalla `MyCreatedRecords` (HC creadas por el doctor actual) usando `GET /medical-records/doctor/:doctorId` | Ruta: `/my-medical-records` |

**Verificación (demo):** Doctor busca "Juan Pérez" → ve perfil del paciente → tab "Historial Clínico" muestra todas sus HC → tap en una → ve detalle. También: desde el perfil, tap "Crear HC" → llena form → guarda → vuelve al perfil y la nueva HC aparece en la lista.

---

### **Resumen de Fases**

| Fase | Alcance | Pantallas nuevas | Endpoints usados |
|---|---|---|---|
| **0** | Cimientos (tipos, cliente HTTP, API layer) | 0 | (definiciones) |
| **1** | Doctor crea/ve HC desde cita | 3 (`Create`, `Edit`, `Detail`) + componentes | `GET/POST/PUT/PUT sign /medical-records`, `GET /medical-records/appointment/:id` |
| **2** | Paciente ve su historial | 1 (`MyMedicalHistory`) | `GET /medical-records/me` ✨ nuevo |
| **3** | Doctor busca paciente → ve historial | 3 (`PatientSearch`, `PatientProfile`, `MyCreatedRecords`) | `GET /patients/search`, `GET /medical-records/patient/:id`, `GET /medical-records/doctor/:id` |

**Total estimado:** 7-10 días de desarrollo (1 frontend dev senior).

---

### **Orden de entrega recomendado**

1. **Fase 0** → base sólida
2. **Fase 1** → desbloquea el flujo core (ya se puede usar desde el detalle de cita)
3. **Fase 2** → entrega rápido valor al paciente (1 pantalla, alto impacto)
4. **Fase 3** → completa el flujo del doctor

Si hay presión de tiempo, **Fase 1 + Fase 2** ya cubren el 80% del valor: doctor puede crear HC y paciente puede verlas. La Fase 3 es un nice-to-have que se puede hacer después.
