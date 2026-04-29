# Backend - Proyecto SocioTech

> **Proyecto educativo** de microservicios con NestJS, PostgreSQL, Redis y arquitectura moderna.

## Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Diagrama del Sistema](#diagrama-del-sistema)
3. [Microservicios](#microservicios)
4. [Clean Architecture](#clean-architecture)
5. [Comunicación entre Servicios](#comunicación-entre-servicios)
6. [Base de Datos](#base-de-datos)
7. [Gateway (nginx)](#gateway-nginx)
8. [Configuración de Ambiente](#configuración-de-ambiente)
9. [Comandos Útiles](#comandos-útiles)
10. [Glosario](#glosario)

---

## Arquitectura General

Este proyecto implementa una **arquitectura de microservicios** donde cada servicio es independiente, tiene su propia base de datos y se comunica mediante eventos asíncronos (Redis Streams).

![diagrama](/doc_assets/diagram_1.PNG)

---

## Diagrama del Sistema

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                    ARQUITECTURA DEL PROYECTO               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   ┌─────────────┐                                                          │
│   │   FRONTEND  │                                                          │
│   └──────┬──────┘                                                          │
│          │ HTTP                                                            │
│          ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │                      NGINX GATEWAY (puerto 80)                  │      │
│   │  ├── /api/auth/*        → auth-service:5001                     │      │
│   │  ├── /api/users/*       → user-service:5002                     │      │
│   │  ├── /api/medical-*    → main-service:5003                      │      │
│   │  ├── /api/appointments*→ main-service:5003                      │      │
│   │  └── /api/sync/*       → sync-service:5004                      │      │
│   └─────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│   ════════════════════════════════════════════════════════════════════     │
│   MICROSERVICIOS (Cada uno es una aplicación NestJS independiente)         │
│   ════════════════════════════════════════════════════════════════════     │
│                                                                            │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │    AUTH      │  │    USER      │  │    MAIN      │  │    SYNC      │   │
│   │  Service     │  │  Service     │  │  Service     │  │  Service     │   │
│   │              │  │              │  │              │  │              │   │
│   │ Puerto: 5001 │  │ Puerto: 5002 │  │ Puerto: 5003 │  │ Puerto: 5004 │   │
│   │              │  │              │  │              │  │              │   │
│   │ DB: auth_    │  │ DB: user_    │  │ DB:clinical_ │  │ DB: MongoDB  │   │
│   │   service    │  │   service    │  │   service    │  │              │   │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                            │
│   ════════════════════════════════════════════════════════════════════     │
│   COMUNICACIÓN EVENT-DRIVEN (Redis Streams)                                │
│   ════════════════════════════════════════════════════════════════════     │
│                                                                            │
│   Auth Service ──publish──→ [user:events stream] ──subscribe               │ 
│   ──→ User Service                                                         │
│                                                                            │
│   ┌──────────────┐                                                         │
│   │  TELEMETRY   │  (Escucha todos los eventos para logging/métricas)      │
│   │  Service     │                                                         │
│   │  Puerto: 5005│                                                         │
│   └──────────────┘                                                         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Microservicios

### 1. Auth Service (Puerto 5001)

**Propósito**: Maneja autenticación, registro y generación de tokens JWT.

**Responsabilidades**:
- Registro de usuarios
- Login con validación de credenciales
- Generación de tokens JWT
- **Publica eventos** cuando se registra un nuevo usuario

**Base de datos**: `auth_service` (PostgreSQL)

**Rutas del API**:
- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión
- `GET /auth/profile` - Obtener perfil (requiere JWT)

**Ejemplo de uso**:
```bash
# Registrar usuario
curl -X POST http://localhost:5001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","firstName":"Juan","lastName":"Perez"}'

# Login
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

---

### 2. User Service (Puerto 5002)

**Propósito**: Gestiona la información de usuarios y replica datos del auth-service.

**Responsabilidades**:
- CRUD de usuarios
- **Escucha eventos** de USER_REGISTERED desde Redis
- Replica usuarios del auth-service

**Base de datos**: `user_service` (PostgreSQL)

**Rutas del API**:
- `GET /users` - Listar todos los usuarios
- `GET /users/:id` - Obtener usuario por ID
- `PUT /users/:id` - Actualizar usuario

---

### 3. Main Service (Puerto 5003)

**Propósito**: Maneja la lógica de negocio principal (expedientes, citas, doctores).

**Responsabilidades**:
- Gestión de pacientes
- Expedientes médicos
- Citas médicas
- Información de doctores

**Base de datos**: `clinical_service` (PostgreSQL)

**Modelos de datos**:
- `Patient` - Pacientes
- `MedicalRecord` - Expedientes médicos
- `Appointment` - Citas
- `MedicalRecordAttachment` - Adjuntos de expedientes

**Rutas del API**:
- `GET /patients/*`, `POST /patients/*`
- `GET /medical-records/*`, `POST /medical-records/*`
- `GET /appointments/*`, `POST /appointments/*`
- `GET /doctors/*`

---

### 4. Sync Service (Puerto 5004)

**Propósito**: Sincronización de datos con sistemas externos.

**Responsabilidades**:
- Sincronización de datos
- Integración con sistemas externos
- Trabaja con MongoDB (base de datos NoSQL)

**Base de datos**: `sync_service` (MongoDB)

---

### 5. Telemetry Service (Puerto 5005)

**Propósito**: Recopila logs y métricas del sistema.

**Responsabilidades**:
- Escuchar todos los eventos del sistema
- Registrar logs de operaciones
- Métricas del sistema

**Base de datos**: `telemetry_service` (PostgreSQL)

**Modelo de datos**:
- `AuditLog` - Registro de auditoria

---

## Clean Architecture

Cada microservicio sigue **Clean Architecture** (también llamada Arquitectura Hexagonal o Ports & Adapters).

### Estructura de Capas

```
src/
├── domain/                    # 🔴 CORE - Reglas de negocio puras
│   ├── entities/              # Entidades del dominio
│   │   └── user.entity.ts     # Definición de Usuario
│   └── repositories/          # Interfaces (Ports)
│       └── user-repository.port.ts
│
├── application/               # 🟡 Casos de uso
│   ├── services/              # Servicios de aplicación
│   │   └── user.service.ts
│   └── dto/                  # Data Transfer Objects
│
├── infrastructure/           # 🟢 Implementaciones externas
│   ├── db/                   # Prisma (DB)
│   │   └── prisma.service.ts
│   ├── repositories/         # Repositorios concretos
│   │   └── prisma-user.repository.ts
│   ├── events/               # Redis Event Bus
│   │   └── redis-event-bus.ts
│   └── strategies/           # Estrategias (JWT, bcrypt)
│
└── presentation/            # 🔵 Controllers
    └── controllers/
        └── user.controller.ts
```

### Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                              │
│                  (Controllers, Routes, DTOs)                        │
│                                                                     │
│   @Controller('/users')                                             │
│   export class UserController {                                     │
│     @Get() findAll() { ... }                                        │
│   }                                                                 │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                               │
│               (Use Cases, Services, Business Logic)                 │
│                                                                     │
│   @Injectable()                                                     │
│   export class UserService {                                        │
│     findAll() { ... }                                               │
│     create(data) { ... }                                            │
│   }                                                                 │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER                                  │
│           (Entities, Repository Interfaces, Value Objects)          │
│                                                                     │
│   class User {                                                      │
│     id: string                                                      │
│     email: string                                                   │
│   }                                                                 │
│                                                                     │
│   interface UserRepository {                                        │
│     findById(id): Promise<User>                                     │
│     save(user): Promise<User>                                       │
│   }                                                                 │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                              │
│             (DB, External APIs, Frameworks)                         │
│                                                                     │
│   class PrismaUserRepository implements UserRepository {            │
│     async findById(id) {                                            │
│       return await this.prisma.user.findUnique(...)                 │
│     }                                                               │
│   }                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### ¿Por qué Clean Architecture?

| Beneficio | Explicación |
|-----------|-------------|
| **Bajo acoplamiento** | Las capas internas no conocen las externas |
| **Alta cohesión** | Cada capa tiene una responsabilidad única |
| **Testabilidad** | Puedes probar el dominio sin	base de datos |
| **Mantenibilidad** | Cambios en DB no afectan la lógica de negocio |
| **Escalabilidad** | Fácil agregar nuevos servicios o funcionalidades |

---

## Comunicación entre Servicios

### Redis Streams (Event-Driven)

Los servicios no se comunican directamente sino a través de **eventos asíncronos** usando Redis Streams.

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE EVENTOS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   AUTH SERVICE (Productor)                                      │
│   ┌─────────────────────┐                                       │
│   │  User Registers     │                                       │
│   │  ─────────────────  │                                       │
│   │  userRepo.save()    │                                       │
│   │  eventBus.publish() │─────────────────┐                     │
│   └─────────────────────┘                 │                     │
│                                           ▼                     │
│                                  ┌─────────────────┐            │
│                                  │  REDIS STREAM   │            │
│                                  │  user:events    │            │
│                                  │  [messages]     │            │
│                                  └─────────────────┘            │
│                                           │                     │
│                    ┌──────────────────────┴────────────┐        │
│                    │                                   │        │
│                    ▼                                   ▼        │
│   ┌───────────────────────┐           ┌───────────────────────┐ │
│   │   USER SERVICE        │           │   TELEMETRY SERVICE   │ │
│   │   (Consumidor)        │           │   (Consumidor)        │ │
│   │                       │           │                       │ │
│   │ eventBus.subscribe()  │           │ eventBus.subscribe()  │ │
│   │ handleUserEvent()     │           │ handleUserEvent()     │ │
│   │ ─────────────────     │           │ ─────────────────     │ │ 
│   │ replicate user to DB  │           │ log to audit DB       │ │
│   └───────────────────────┘           └───────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Estructura de un Evento

```typescript
interface DomainEvent {
  streamName: string;    // Nombre del stream (ej: 'user:events')
  eventType: string;     // Tipo de evento (ej: 'USER_REGISTERED')
  payload: {            // Datos del evento
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  timestamp: Date;      // Cuándo ocurrió
}
```

### Ejemplo: Publicar un Evento (Auth Service)

```typescript
// En auth.service.ts
const event: DomainEvent = {
  streamName: 'user:events',
  eventType: 'USER_REGISTERED',
  payload: {
    id: saved.id,
    email: saved.email,
    passwordHash: saved.passwordHash,  // ← Se envía el hash
    firstName: saved.firstName,
    lastName: saved.lastName,
    role: saved.role,
  },
  timestamp: new Date(),
};

await this.eventBus.publish(event);
```

### Ejemplo: Consumir un Evento (User Service)

```typescript
// En user-event.subscriber.ts
await this.eventBus.subscribe(
  'user:events',              // Stream name
  'user-service-group',       // Consumer group
  'user-service-consumer',   // Consumer name
  this.handleUserEvent.bind(this),
);

private async handleUserEvent(event: DomainEvent): Promise<void> {
  if (event.eventType === 'USER_REGISTERED') {
    const { id, email, passwordHash, firstName, lastName, role } = event.payload;

    // Replicar en la base de datos del user-service
    await this.userRepo.save({
      id,
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      isActive: true,
    });
  }
}
```

---

## Base de Datos

### Esquemas de Prisma

Cada servicio tiene su propio **schema de Prisma** y base de datos:

```
prisma/
├── schema.prisma                      # Schema principal (no usado)
│
apps/
├── auth-service/
│   └── src/infrastructure/db/
│       └── schema.prisma              # → auth_service DB
├── user-service/
│   └── src/infrastructure/db/
│       └── schema.prisma              # → user_service DB
├── main-service/
│   └── src/infrastructure/db/
│       └── schema.prisma              # → clinical_service DB
├── telemetry-service/
│   └── src/infrastructure/db/
│       └── schema.prisma              # → telemetry_service DB
```

### Modelos de Datos

#### User (Auth & User Service)
```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String?
  role         String
  firstName    String
  lastName     String
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@map("users")
}
```

#### Patient (Main Service)
```prisma
model Patient {
  id               String   @id @default(uuid())
  userId           String   @unique
  medicalId        String   @unique
  dateOfBirth      DateTime
  phone            String
  address          String
  emergencyContact String
  emergencyPhone   String
  bloodType        String?
  allergies        String[]

  appointments    Appointment[]
  medicalRecords  MedicalRecord[]
}
```

### Comandos de Migración

```bash
# Crear migración para un servicio específico
cd apps/user-service
npx prisma migrate dev --schema=src/infrastructure/db/schema.prisma \
  --url="postgresql://user:pass@localhost:5432/user_service" \
  --name init_user_service

# Generar cliente Prisma
npx prisma generate --schema=src/infrastructure/db/schema.prisma
```

---

## Gateway (nginx)

El gateway recibe todas las peticiones HTTP y las enruta al microservicio correspondiente.

### Configuración (gateway/nginx.conf)

```nginx
upstream auth_service {
    server localhost:5001;
}

upstream user_service {
    server localhost:5002;
}

server {
    listen 80;
    server_name _;

    # Auth routes
    location /api/auth/ {
        proxy_pass http://auth_service/auth/;
        proxy_set_header Host $host;
        # ... más headers
    }

    # User routes
    location /api/users/ {
        proxy_pass http://user_service;
        # ...
    }

    # Health check
    location /health {
        return 200 '{"status":"OK","services":["auth","user","main","sync"]}';
    }
}
```

### Rutas del Gateway

| Endpoint | Servicio | Puerto |
|----------|----------|--------|
| `/api/auth/*` | Auth Service | 5001 |
| `/api/users/*` | User Service | 5002 |
| `/api/medical-records/*` | Main Service | 5003 |
| `/api/appointments/*` | Main Service | 5003 |
| `/api/doctors/*` | Main Service | 5003 |
| `/api/sync/*` | Sync Service | 5004 |

---

## Configuración de Ambiente

### Archivos .env

Cada servicio tiene su propio archivo `.env`:

```
apps/auth-service/.env
apps/user-service/.env
apps/main-service/.env
apps/sync-service/.env
apps/telemetry-service/.env
```

### Variables Comunes

```env
# Base de datos (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/service_name"

# Redis (para eventos)
REDIS_URL="redis://:password@192.168.0.232:6379"

# JWT
JWT_SECRET="your-secret-key"

# Puerto del servicio
PORT=5001

# Entorno
NODE_ENV=development
```

### Cargar variables por servicio

Usamos `dotenv-cli` para cargar el .env correcto:

```json
// package.json
{
  "scripts": {
    "start:auth": "dotenv -e apps/auth-service/.env -- node dist/apps/auth-service/main.js"
  }
}
```

---

## Comandos Útiles

### Iniciar todos los servicios

```powershell
# Iniciar todos los microservicios
.\scripts\start-all.ps1

# Detener todos
.\scripts\stop-all.ps1
```

### Iniciar Gateway

```powershell
# Iniciar nginx
.\gateway\start-gateway.ps1

# Detener nginx
.\gateway\stop-gateway.ps1
```

### Desarrollo

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Desarrollo con hot-reload
npm run start:dev

# Ejecución individual de servicios
npm run start:auth
npm run start:user
npm run start:main
npm run start:sync
npm run start:telemetry
```

### Base de datos

```bash
# Hacer migración
cd apps/user-service
npx prisma migrate dev --schema=src/infrastructure/db/schema.prisma \
  --url="postgresql://..." --name migration_name

# Regenerar cliente
npx prisma generate --schema=src/infrastructure/db/schema.prisma
```

### Testing

```bash
# Tests unitarios
npm run test

# Coverage
npm run test:cov
```

---

## Glosario

### Términos Técnicos

| Término | Definición |
|---------|------------|
| **Microservicio** | Aplicación pequeña e independiente que realiza una función específica |
| **Clean Architecture** | Patrón de arquitectura que separa el código en capas (domain, application, infrastructure, presentation) |
| **Event-Driven** | Arquitectura donde los servicios se comunican mediante eventos asíncronos |
| **Redis Streams** | Estructura de datos de Redis para mensajes persistentes y publicación/subscripción |
| **Consumer Group** | Grupo de consumidores que comparten el procesamiento de mensajes |
| **Gateway** | Servidor que recibe todas las peticiones y las distribuye a los servicios |
| **Prisma** | ORM (Object-Relational Mapper) para TypeScript/Node.js |
| **JWT** | JSON Web Token - estándar para autenticación stateless |
| **Adapter** | Patrón para convertir interfaces incompatibles |
| **Port** | Interfaz que define cómo la aplicación se comunica con el exterior |
| **DI (Dependency Injection)** | Patrón para inyectar dependencias en lugar de crearlas internamente |

### Conceptos de Negocio

| Término | Definición |
|---------|------------|
| **Audit Log** | Registro de todas las operaciones realizadas en el sistema |
| **Domain Event** | Evento que ocurre en el dominio de la aplicación |
| **Replicación** | Copia de datos de un servicio a otro |
| **CQRS** | Command Query Responsibility Segregation - separar comandos de consultas |

### Patrones de Diseño

| Patrón | Descripción |
|--------|-------------|
| **Repository** | Abstrae la capa de datos, proporciona interfaz para CRUD |
| **Unit of Work** | Agrupa múltiples operaciones en una transacción |
| **Factory** | Crea objetos sin especificar la clase exacta |
| **Strategy** | Define familias de algoritmos intercambiables |

---

## Estructura de Archivos del Proyecto

```
backend-proyecto-sociotech/
│
├── apps/                          # Código de los microservicios
│   ├── auth-service/             # Servicio de autenticación
│   │   ├── src/
│   │   │   ├── domain/           # Entidades y puertos
│   │   │   ├── application/     # Casos de uso
│   │   │   ├── infrastructure/  # Implementaciones (DB, Redis)
│   │   │   └── presentation/    # Controllers
│   │   └── .env                 # Variables de entorno
│   │
│   ├── user-service/            # Servicio de usuarios
│   ├── main-service/            # Servicio principal (clinical)
│   ├── sync-service/            # Servicio de sincronización
│   └── telemetry-service/       # Servicio de telemetría
│
├── gateway/                      # Configuración de nginx
│   ├── nginx.conf               # Configuración del gateway
│   ├── start-gateway.ps1         # Script para iniciar
│   └── stop-gateway.ps1          # Script para detener
│
├── scripts/                      # Scripts de utilidad
│   ├── start-all.ps1            # Iniciar todos los servicios
│   └── stop-all.ps1             # Detener todos los servicios
│
├── prisma/                      # Configuración de Prisma
│   ├── schema.prisma            # Schema principal
│   ├── prisma.config.ts        # Configuración de Prisma 7
│   └── migrations/             # Migraciones de la BD
│
├── node_modules/               # Dependencias instaladas
├── package.json               # Configuración de npm
├── tsconfig.json              # Configuración de TypeScript
└── README.md                  # Este archivo
```
