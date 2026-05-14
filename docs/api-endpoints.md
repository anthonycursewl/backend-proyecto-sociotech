# API Endpoints — Consultorio Sociotech

## Autenticación (`/auth`)

### `POST /auth/register`
Público — Registro de nuevo usuario (rol PATIENT por defecto).

**Request body:**
```typescript
{
  email: string;
  password: string;     // mínimo 6 caracteres
  firstName: string;
  lastName: string;
}
```

**Response `201`:**
```typescript
{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: string;
    roleName: string;
    permissions: string[];
  }
}
```

---

### `POST /auth/login`
Público.

**Request body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response `200`:**
```typescript
{
  accessToken: string;
  refreshToken: string;
  user: { id, email, firstName, lastName, roleId, roleName, permissions[] }
}
```

---

### `POST /auth/refresh`
Público.

**Request body:**
```typescript
{ refreshToken: string }
```

**Response `200`:** Mismo que login.

---

### `GET /auth/me`
Requiere: `AuthGuard('jwt')`

**Response `200`:**
```typescript
{
  user: {
    id, email, firstName, lastName, roleId,
    roleName, permissions[], isActive, createdAt, updatedAt
  }
}
```

---

## Usuarios (`/users`)
Todos requieren `AuthGuard('jwt')`.

### `GET /users/profile/:userId`
| Parámetro | Tipo | Validación |
|-----------|------|------------|
| `userId` | string | UUID |

**Response `200`:** `{ user: User }`

---

### `PUT /users/profile/:userId`
| Parámetro | Tipo |
|-----------|------|
| `userId` | UUID |

**Request body:** `{ firstName?: string, lastName?: string }`

**Response `200`:** `{ user: User }`

---

### `GET /users/patients`
**Response `200`:** `{ patients: User[] }`

### `GET /users/patients/:patientId`
**Response `200`:** `{ patient: User }` | **404:** `{ message: "Patient not found" }`

### `GET /users/doctors`
**Response `200`:** `{ doctors: User[] }`

### `GET /users/search`
| Query | Tipo | Default |
|-------|------|---------|
| `q` | string | — |
| `limit` | string (int) | 20 |

**Response `200`:** `{ users: User[] }`

---

## Roles (`/roles`)
Todos requieren `AuthGuard('jwt')`.

### `GET /roles`
**Response `200`:** `Role[]`

### `GET /roles/:id`
| Parámetro | Tipo | Validación |
|-----------|------|------------|
| `id` | string | UUID |

**Response `200`:** `Role` (con `permissions[]`)

### `POST /roles` — Permiso: `roles:create`
**Body:** `{ name: string, description?: string }` → **201:** `Role`

### `PUT /roles/:id` — Permiso: `roles:update`
**Body:** `{ description?: string }` → **200:** `Role`

### `DELETE /roles/:id` — Permiso: `roles:delete`
**Response `204`**

### `POST /roles/:id/permissions` — Permiso: `roles:update`
**Body:** `{ permissionId: string }` → **200:** `Role`

### `PUT /roles/:id/permissions` — Permiso: `roles:update`
**Body:** `{ permissionIds: string[] }` → **200:** `Role`

### `DELETE /roles/:id/permissions/:permissionId` — Permiso: `roles:update`
**Response `200`:** `Role`

---

## Pacientes (`/patients`)
Todos requieren `AuthGuard('jwt')`.

### `POST /patients` — Permiso: `patients:create`
**Request body:**
```typescript
{
  userId: string;
  cedula: string;             // Cédula de identidad
  dateOfBirth: string;
  gender?: string;
  occupation?: string;
  civilStatus?: string;
  phone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType?: string;
  allergies?: string[];
  currentMedications?: string[];
  chronicDiseases?: string[];
}
```

**Response `201`:** `PatientResponse`
**Response `400`:** `{ message: "This user already has a patient record" }`

---

### `POST /patients/me` — Permiso: `patients:create:own`
**Request body:**
```typescript
{
  cedula: string;             // Cédula de identidad
  dateOfBirth: string;
  gender?: string;
  occupation?: string;
  civilStatus?: string;
  phone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType?: string;
  allergies?: string[];
  currentMedications?: string[];
  chronicDiseases?: string[];
}
```

**Response `201`:** `PatientResponse`
**Response `400`:** `{ message: "You already have a patient record. You can only register once." }`

---

### `GET /patients` — Permiso: `patients:read`
**Response `200`:** `PatientResponse[]`

### `GET /patients/me` — Permiso: `patients:read:own`
**Response `200`:** `PatientResponse`
**Response `404`:** `{ message: "Patient profile not found" }`

### `PUT /patients/me` — Permiso: `patients:update:own`
**Body:** `UpdatePatientDto` (todos opcionales)
**Response `200`:** `PatientResponse`
**Response `404`:** `{ message: "Patient profile not found" }`

### `GET /patients/search` — Permiso: `patients:read`
| Query | Tipo | Default |
|-------|------|---------|
| `q` | string | — |
| `limit` | string | 20 |

**Response `200`:** `PatientResponse[]`

### `GET /patients/:id` — Permiso: `patients:read`
| Parámetro | Tipo |
|-----------|------|
| `id` | UUID |

**Response `200`:** `PatientResponse`
**Response `404`:** `{ message: "Patient not found" }`

### `PUT /patients/:id` — Permiso: `patients:update`
| Parámetro | Tipo |
|-----------|------|
| `id` | UUID |

**Body:** `UpdatePatientDto`
**Response `200`:** `PatientResponse`

---

### `PatientResponse` (contrato compartido)

```typescript
{
  id: string;
  userId: string;
  medicalId: string;                // "HM-{timestamp}-{RAND}"
  cedula: string | null;            // Cédula de identidad
  dateOfBirth: string;
  gender: string | null;
  occupation: string | null;
  civilStatus: string | null;
  phone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType: string | null;
  allergies: string[];
  currentMedications: string[];
  chronicDiseases: string[];
  createdAt: string;
  updatedAt: string;
}
```

---

## Servicios (`/services`)
Todos requieren `AuthGuard('jwt')`.

### `POST /services` — Permiso: `services:create`
**Body:** `{ name, description?, durationMin?, price? }` → **201:** `ServiceResponse`

### `GET /services` — Permiso: `services:read`
| Query | Tipo | Descripción |
|-------|------|-------------|
| `cursor` | string | ID del último elemento |
| `limit` | number | Elementos por página |
| `includeInactive` | boolean | Incluir inactivos |

**Response `200`:**
```typescript
{ data: ServiceResponse[], nextCursor: string | null }
```

### `GET /services/:id` — Permiso: `services:read`
**Response `200`:** `ServiceResponse`
**Response `404`:** `{ message: "Service not found" }`

### `PUT /services/:id` — Permiso: `services:update`
**Body:** `{ name?, description?, durationMin?, price?, isActive? }`
**Response `200`:** `ServiceResponse`

### `DELETE /services/:id` — Permiso: `services:delete`
Soft delete (`isActive = false`)
**Response `200`:** void
**Response `404`:** `{ message: "Service not found" }`

---

### `ServiceResponse`

```typescript
{
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Doctores (`/doctors`)

### `POST /doctors/profile` — Permiso: `doctors:create:own`
**Body:** `{ specialty, licenseNumber, consultationPrice?, biography?, phoneNumber? }` → **201:** `Doctor`

### `POST /doctors` — Permiso: `doctors:manage`
**Body:** Mismo que arriba → **201:** `Doctor`

### `GET /doctors`
| Query | Tipo |
|-------|------|
| `includeInactive` | string ("true") |

**Response `200`:** `Doctor[]`

### `GET /doctors/:id`
**Response `200`:** `Doctor`

### `GET /doctors/user/:userId`
**Response `200`:** `Doctor`

### `PUT /doctors/:id` — Permiso: `doctors:manage`
**Body:** `{ specialty?, licenseNumber?, consultationPrice?, biography?, phoneNumber?, isActive? }`
**Response `200`:** `Doctor`

### `DELETE /doctors/:id` — Permiso: `doctors:manage`
Soft delete. **Response `200`:** void

---

### `Doctor`

```typescript
{
  id: string;
  userId: string;
  specialty: string;
  licenseNumber: string;
  consultationPrice: number | null;
  biography: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Horarios (`/doctors/me/schedules`, `/doctors/:doctorId/schedules`)

### `POST /doctors/me/schedules` — Permiso: `schedules:create:own`
**Body:** `{ dayOfWeek: 0-6, startTime, endTime, isActive? }` → **201:** `DoctorSchedule`

### `GET /doctors/me/schedules` — Permiso: `schedules:create:own`
**Response `200`:** `DoctorSchedule[]`

### `PUT /doctors/me/schedules/:id` — Permiso: `schedules:create:own`
**Body:** `{ startTime?, endTime?, isActive? }` → **200:** `DoctorSchedule`

### `DELETE /doctors/me/schedules/:id` — Permiso: `schedules:create:own`
**Response `200`:** `{ success: true }`

### `POST /doctors/:doctorId/schedules` — Permiso: `schedules:manage`
**Body:** `{ dayOfWeek, startTime, endTime, isActive? }` → **201:** `DoctorSchedule`

### `GET /doctors/:doctorId/schedules`
**Response `200`:** `DoctorSchedule[]`

### `PUT /doctors/:doctorId/schedules/:id` — Permiso: `schedules:manage`
**Body:** `{ startTime?, endTime?, isActive? }` → **200:** `DoctorSchedule`

### `DELETE /doctors/:doctorId/schedules/:id` — Permiso: `schedules:manage`
**Response `200`:** `{ success: true }`

---

### `DoctorSchedule`

```typescript
{
  id: string;
  doctorId: string;
  dayOfWeek: number;       // 0-6
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Citas (`/appointments`)
Todos requieren `AuthGuard('jwt')`.

### `POST /appointments` — Permiso: `appointments:create:own`
**Body:**
```typescript
{
  doctorId: string;       // UUID
  serviceId: string;      // UUID
  scheduledAt: string;    // ISO date
  timeSlot: string;       // "HH:mm"
  reason: string;
  notes?: string;
}
```

**Response `201`:** `Appointment`

---

### `GET /appointments/me` — Permiso: `appointments:read:own`
**Response `200`:** `{ appointments: Appointment[] }`

### `GET /appointments/available-slots`
| Query | Tipo |
|-------|------|
| `doctorId` | UUID |
| `serviceId` | UUID |
| `date` | ISO date |

**Response `200`:** `{ slots: string[] }`

### `GET /appointments` — Permiso: `appointments:read`
**Response `200`:** `Appointment[]`

### `GET /appointments/:id`
| Parámetro | Tipo |
|-----------|------|
| `id` | UUID |

**Response `200`:** `Appointment`

### `PUT /appointments/:id/cancel` — Permiso: `appointments:cancel:own`
**Body:** `{ reason?: string }`
**Response `200`:** `Appointment` (status = `CANCELLED`)

---

### `Appointment`

```typescript
{
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  scheduledAt: Date;
  timeSlot: string;
  durationMinutes: number;
  status: string;     // SCHEDULED | CONFIRMED | COMPLETED | CANCELLED | NO_SHOW
  reason: string;
  notes?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Permisos por Rol

### PATIENT
```
services:read
patients:create:own, patients:read:own, patients:update:own
appointments:create:own, appointments:read:own, appointments:cancel:own
medical-records:read:own
```

### ASSISTANT
```
patients:read, patients:create, patients:update
services:read
appointments:read, appointments:create, appointments:update
doctors:read
patients:read:own, appointments:read:own
```

### DOCTOR
```
patients:read, patients:create, patients:update
services:read, services:create, services:update, services:delete
medical-records:read, medical-records:create, medical-records:update, medical-records:sign
appointments:read, appointments:create, appointments:update, appointments:cancel
doctors:read
reports:read, reports:generate
doctors:create:own, schedules:create:own
appointments:read:own, medical-records:read:own, patients:read:own
```

### ADMIN
```
users:read, users:create, users:update, users:delete
roles:read
patients:read, patients:create, patients:update, patients:delete
services:read, services:create, services:update, services:delete
medical-records:read, medical-records:create, medical-records:update, medical-records:delete, medical-records:sign
appointments:read, appointments:create, appointments:update, appointments:cancel
doctors:read, doctors:create, doctors:update, doctors:delete
reports:read, reports:generate, reports:export
audit:read
doctors:manage, schedules:manage, appointments:manage
```

### SUPER_ADMIN
Todos los permisos (incluyendo `users:assign-role`, `roles:create`, `roles:delete` y todos los `:own`).
