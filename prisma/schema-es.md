# Documentación del esquema de base de datos

### Usuario

```prisma
model Usuario {
  id                    String    @id @default(uuid())
  correo                String    @unique @map("email")
  hashContrasena        String    @map("passwordHash")
  rolId                 String    @map("roleId")
  nombre                String    @map("firstName")
  apellido              String    @map("lastName")
  estaActivo            Boolean   @default(true) @map("isActive")
  tokenRefresco         String?   @unique @map("refreshToken")
  expiraTokenRefresco   DateTime? @map("refreshTokenExpires")
  creadoEn              DateTime  @default(now()) @map("createdAt")
  actualizadoEn         DateTime  @updatedAt @map("updatedAt")

  rol                  Rol                    @relation(fields: [rolId], references: [id])
  pacientes            Paciente[]
  serviciosCreados     Servicio[]             @relation("ServiceCreator")
  perfilMedico         Medico?                @relation("DoctorUser")
  cancelacionesCita    CancelacionCita[]      @relation("AppointmentCanceller")

  @@map("users")
}
```

---

### Rol

```prisma
model Rol {
  id          String   @id @default(uuid())
  nombre      String   @unique @map("name")
  descripcion String?  @map("description")
  esSistema   Boolean  @default(false) @map("isSystem")
  eliminadoEn DateTime? @map("deletedAt")
  creadoEn    DateTime @default(now()) @map("createdAt")
  actualizadoEn DateTime @updatedAt @map("updatedAt")

  permisos RolPermiso[]
  usuarios Usuario[]

  @@map("roles")
}
```

---

### Permiso

```prisma
model Permiso {
  id          String   @id @default(uuid())
  nombre      String   @unique @map("name")
  descripcion String?  @map("description")
  recurso     String   @map("resource")
  accion      String   @map("action")
  creadoEn    DateTime @default(now()) @map("createdAt")

  roles RolPermiso[]

  @@unique([recurso, accion])
  @@map("permissions")
}
```

---

### RolPermiso

```prisma
model RolPermiso {
  id          String   @id @default(uuid())
  rolId       String   @map("roleId")
  permisoId   String   @map("permissionId")
  creadoEn    DateTime @default(now()) @map("createdAt")

  rol     Rol     @relation(fields: [rolId], references: [id], onDelete: Cascade)
  permiso Permiso @relation(fields: [permisoId], references: [id], onDelete: Cascade)

  @@unique([rolId, permisoId])
  @@map("role_permissions")
}
```

---

### Servicio

```prisma
model Servicio {
  id            String   @id @default(uuid())
  nombre        String   @unique @map("name")
  descripcion   String?  @map("description")
  duracionMin   Int      @default(30) @map("durationMin")
  precio        Float?   @map("price")
  estaActivo    Boolean  @default(true) @map("isActive")
  creadoEn      DateTime @default(now()) @map("createdAt")
  actualizadoEn DateTime @updatedAt @map("updatedAt")

  creadoPor String @map("createdBy")
  creador   Usuario @relation("ServiceCreator", fields: [creadoPor], references: [id], onDelete: Cascade)

  medicos      Medico[] @relation("DoctorServices")
  citas        Cita[]

  @@map("services")
}
```

---

### Medico

```prisma
model Medico {
  id                String   @id @default(uuid())
  usuarioId         String   @unique @map("userId")
  especialidad      String   @map("specialty")
  numeroLicencia    String   @unique @map("licenseNumber")
  precioConsulta    Float?   @map("consultationPrice")
  biografia         String?  @map("biography")
  telefono          String?  @map("phoneNumber")
  estaActivo        Boolean  @default(true) @map("isActive")
  visible           Boolean  @default(true) @map("isVisible")
  creadoEn          DateTime @default(now()) @map("createdAt")
  actualizadoEn     DateTime @updatedAt @map("updatedAt")

  usuario              Usuario           @relation("DoctorUser", fields: [usuarioId], references: [id], onDelete: Cascade)
  servicios            Servicio[]        @relation("DoctorServices")
  horarios             HorarioMedico[]
  citas                Cita[]
  historiasComoDoctor  HistoriaClinica[] @relation("MedicalRecordDoctor")

  @@map("doctors")
}
```

---

### HorarioMedico

```prisma
model HorarioMedico {
  id          String   @id @default(uuid())
  medicoId    String   @map("doctorId")
  diaSemana   Int      @map("dayOfWeek")
  horaInicio  String   @map("startTime")
  horaFin     String   @map("endTime")
  estaActivo  Boolean  @default(true) @map("isActive")
  creadoEn    DateTime @default(now()) @map("createdAt")
  actualizadoEn DateTime @updatedAt @map("updatedAt")

  medico Medico @relation(fields: [medicoId], references: [id], onDelete: Cascade)

  @@unique([medicoId, diaSemana])
  @@map("doctor_schedules")
}
```

---

### Paciente

```prisma
model Paciente {
  id                 String   @id @default(uuid())
  usuarioId          String   @unique @map("userId")
  idMedicoRegistro   String   @unique @map("medicalId")
  cedula             String?  @unique
  fechaNacimiento    DateTime @map("dateOfBirth")
  genero             String?  @map("gender")
  ocupacion          String?  @map("occupation")
  estadoCivil        String?  @map("civilStatus")
  telefono           String   @map("phone")
  direccion          String   @map("address")
  contactoEmergencia String   @map("emergencyContact")
  telefonoEmergencia String   @map("emergencyPhone")
  tipoSangre         String?  @map("bloodType")
  creadoEn           DateTime @default(now()) @map("createdAt")
  actualizadoEn      DateTime @updatedAt @map("updatedAt")

  citas              Cita[]
  historiasClinicas  HistoriaClinica[]
  alergias           AlergiaPaciente[]
  medicaciones       MedicacionPaciente[]
  enfermedadesCronicas EnfermedadCronicaPaciente[]
  usuario            Usuario @relation(fields: [usuarioId], references: [id], onDelete: Cascade)

  @@map("patients")
}
```

---

### AlergiaPaciente

```prisma
model AlergiaPaciente {
  id         String   @id @default(uuid())
  pacienteId String   @map("patientId")
  nombre     String   @map("name")
  severidad  String?  @map("severity")
  notas      String?  @map("notes")
  creadoEn   DateTime @default(now()) @map("createdAt")

  paciente Paciente @relation(fields: [pacienteId], references: [id], onDelete: Cascade)

  @@index([pacienteId])
  @@map("patient_allergies")
}
```

---

### MedicacionPaciente

```prisma
model MedicacionPaciente {
  id           String   @id @default(uuid())
  pacienteId   String   @map("patientId")
  nombre       String   @map("name")
  dosis        String?  @map("dosage")
  frecuencia   String?  @map("frequency")
  prescritoPor String?  @map("prescribedBy")
  creadoEn     DateTime @default(now()) @map("createdAt")

  paciente Paciente @relation(fields: [pacienteId], references: [id], onDelete: Cascade)

  @@index([pacienteId])
  @@map("patient_medications")
}
```

---

### EnfermedadCronicaPaciente

```prisma
model EnfermedadCronicaPaciente {
  id             String    @id @default(uuid())
  pacienteId     String    @map("patientId")
  nombre         String    @map("name")
  diagnosticadaEn DateTime? @map("diagnosedAt")
  notas          String?   @map("notes")
  creadoEn       DateTime  @default(now()) @map("createdAt")

  paciente Paciente @relation(fields: [pacienteId], references: [id], onDelete: Cascade)

  @@index([pacienteId])
  @@map("patient_chronic_diseases")
}
```

---

### HistoriaClinica

```prisma
model HistoriaClinica {
  id                   String    @id @default(uuid())
  pacienteId           String    @map("patientId")
  medicoId             String    @map("doctorId")
  citaId               String?   @unique @map("appointmentId")
  motivoConsulta       String    @map("chiefComplaint")
  sintomas             String[]  @map("symptoms")
  diagnostico          String    @map("diagnosis")
  codigoDiagnostico    String?   @map("diagnosis_code")
  tratamiento          String    @map("treatment")
  notas                String    @map("notes")
  firmado              Boolean   @default(false) @map("isSigned")
  firmadoEn            DateTime? @map("signedAt")
  presionArterial      String?   @map("blood_pressure")
  frecuenciaCardiaca   Int?      @map("heart_rate")
  temperatura          Float?    @map("temperature")
  peso                 Float?    @map("weight")
  altura               Float?    @map("height")
  frecuenciaRespiratoria Int?    @map("respiratory_rate")
  saturacionOxigeno    Int?      @map("oxygen_saturation")
  creadoEn             DateTime  @default(now()) @map("createdAt")
  actualizadoEn        DateTime  @updatedAt @map("updatedAt")

  prescripciones PrescripcionMedica[]
  adjuntos       AdjuntoHistoriaClinica[]
  paciente       Paciente       @relation(fields: [pacienteId], references: [id], onDelete: Cascade)
  medico         Medico         @relation("MedicalRecordDoctor", fields: [medicoId], references: [id], onDelete: Restrict)
  cita           Cita?          @relation(fields: [citaId], references: [id], onDelete: SetNull)

  @@index([medicoId])
  @@index([pacienteId])
  @@map("medical_records")
}
```

---

### PrescripcionMedica

```prisma
model PrescripcionMedica {
  id                String   @id @default(uuid())
  historiaClinicaId String   @map("medical_record_id")
  nombreMedicamento String   @map("medication_name")
  dosis             String?  @map("dosage")
  frecuencia        String?  @map("frequency")
  duracion          String?  @map("duration")
  instrucciones     String?  @map("instructions")
  creadoEn          DateTime @default(now()) @map("created_at")

  historiaClinica HistoriaClinica @relation(fields: [historiaClinicaId], references: [id], onDelete: Cascade)

  @@index([historiaClinicaId])
  @@map("medical_prescriptions")
}
```

---

### AdjuntoHistoriaClinica

```prisma
model AdjuntoHistoriaClinica {
  id              String   @id @default(uuid())
  historiaClinicaId String @map("medicalRecordId")
  urlArchivo      String   @map("fileUrl")
  nombreArchivo   String   @map("fileName")
  mimeType        String   @map("mimeType")
  descripcion     String?  @map("description")
  subidoEn        DateTime @default(now()) @map("uploadedAt")

  historiaClinica HistoriaClinica @relation(fields: [historiaClinicaId], references: [id], onDelete: Cascade)

  @@map("medical_record_attachments")
}
```

---

### Cita

```prisma
model Cita {
  id              String    @id @default(uuid())
  pacienteId      String    @map("patientId")
  medicoId        String    @map("doctorId")
  servicioId      String    @map("serviceId")
  programadoPara  DateTime  @map("scheduledAt")
  estado          String    @default("SCHEDULED") @map("status")
  motivo          String    @map("reason")
  notas           String?   @map("notes")
  creadoEn        DateTime  @default(now()) @map("createdAt")
  actualizadoEn   DateTime  @updatedAt @map("updatedAt")

  paciente      Paciente            @relation(fields: [pacienteId], references: [id], onDelete: Cascade)
  medico        Medico              @relation(fields: [medicoId], references: [id], onDelete: Cascade)
  servicio      Servicio            @relation(fields: [servicioId], references: [id], onDelete: Cascade)
  cancelacion   CancelacionCita?
  historiaClinica HistoriaClinica?

  @@index([medicoId, programadoPara])
  @@index([pacienteId, programadoPara])
  @@index([estado])
  @@map("appointments")
}
```

---

### CancelacionCita

```prisma
model CancelacionCita {
  id                String   @id @default(uuid())
  citaId            String   @unique @map("appointmentId")
  canceladoPor      String   @map("cancelledBy")
  razonCancelacion  String?  @map("cancellationReason")
  canceladoEn       DateTime @default(now()) @map("cancelledAt")

  usuarioQueCancelo Usuario    @relation("AppointmentCanceller", fields: [canceladoPor], references: [id], onDelete: Restrict)
  cita              Cita       @relation(fields: [citaId], references: [id], onDelete: Cascade)

  @@index([canceladoPor])
  @@map("appointment_cancellations")
}
```

---

### RegistroAuditoria

```prisma
model RegistroAuditoria {
  id           String
  usuarioId    String?  @map("userId")
  accion       String   @map("action")
  tipoEntidad  String   @map("entityType")
  idEntidad    String   @map("entityId")
  valoresViejos Json?   @map("oldValues")
  valoresNuevos Json?   @map("newValues")
  direccionIp  String?  @map("ipAddress")
  agenteUsuario String? @map("userAgent")
  timestamp    DateTime @default(now())

  @@id([id, timestamp])
  @@index([tipoEntidad, idEntidad])
  @@index([usuarioId])
  @@index([timestamp])
  @@map("audit_logs")
}
```

---

### Notificacion

```prisma
model Notificacion {
  id                String    @id @default(uuid())
  tipoEvento        String    @map("eventType")
  correoDestinatario String   @map("recipientEmail")
  nombreDestinatario String?  @map("recipientName")
  asunto            String    @map("subject")
  cuerpo            String?   @map("body")
  estado            String    @default("PENDING") @map("status")
  mensajeError      String?   @map("errorMessage")
  intentos          Int       @default(0) @map("retryCount")
  reintentosMaximos Int       @default(3) @map("maxRetries")
  ultimoIntento     DateTime? @map("lastAttemptAt")
  enviadoEn         DateTime? @map("sentAt")
  creadoEn          DateTime  @default(now()) @map("createdAt")
  actualizadoEn     DateTime  @updatedAt @map("updatedAt")

  @@index([estado])
  @@index([creadoEn])
  @@map("notifications")
}
```

---

### VerificacionEmail

```prisma
model VerificacionEmail {
  id        String   @id @default(uuid())
  correo    String   @map("email")
  codigo    String   @map("code")
  expiraEn  DateTime @map("expiresAt")
  verificado Boolean @default(false) @map("verified")
  creadoEn  DateTime @default(now()) @map("createdAt")

  @@index([correo])
  @@index([correo, codigo])
  @@map("email_verifications")
}
```

---

### MetricasPaciente

```prisma
model MetricasPaciente {
  id            String   @id @default(uuid())
  totalActivos  Int      @default(0) @map("totalActive")
  totalInactivos Int     @default(0) @map("totalInactive")
  totalNuevos   Int      @default(0) @map("totalNew")
  actualizadoEn DateTime @updatedAt @map("updatedAt")

  @@map("patient_metrics")
}
```
