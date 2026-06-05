export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const ENTITY_CACHE_TTL = 30_000;
export const GLOBAL_CACHE_TTL = 60_000;

export const DEFAULT_SERVICE_DURATION = 30;
export const DEFAULT_APPOINTMENT_DURATION = 30;
export const BUSINESS_HOURS_START = 8;
export const BUSINESS_HOURS_END = 17;
export const BUSINESS_HOURS_END_DOMAIN = 18;
export const SLOT_DURATION = 30;

export enum RoleName {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  ASSISTANT = 'ASSISTANT',
}

export const PROTECTED_ROLES: readonly string[] = [
  RoleName.SUPER_ADMIN,
  RoleName.ADMIN,
];

export const Permission = {
  // users
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_ASSIGN_ROLE: 'users:assign-role',
  USERS_UPDATE_OWN: 'users:update:own',
  // patients
  PATIENTS_READ: 'patients:read',
  PATIENTS_CREATE: 'patients:create',
  PATIENTS_UPDATE: 'patients:update',
  PATIENTS_DELETE: 'patients:delete',
  PATIENTS_READ_OWN: 'patients:read:own',
  PATIENTS_CREATE_OWN: 'patients:create:own',
  PATIENTS_UPDATE_OWN: 'patients:update:own',
  // doctors
  DOCTORS_READ: 'doctors:read',
  DOCTORS_CREATE: 'doctors:create',
  DOCTORS_UPDATE: 'doctors:update',
  DOCTORS_DELETE: 'doctors:delete',
  DOCTORS_CREATE_OWN: 'doctors:create:own',
  DOCTORS_UPDATE_OWN: 'doctors:update:own',
  DOCTORS_MANAGE: 'doctors:manage',
  // services
  SERVICES_READ: 'services:read',
  SERVICES_CREATE: 'services:create',
  SERVICES_UPDATE: 'services:update',
  SERVICES_DELETE: 'services:delete',
  // appointments
  APPOINTMENTS_READ: 'appointments:read',
  APPOINTMENTS_CREATE: 'appointments:create',
  APPOINTMENTS_UPDATE: 'appointments:update',
  APPOINTMENTS_CANCEL: 'appointments:cancel',
  APPOINTMENTS_READ_OWN: 'appointments:read:own',
  APPOINTMENTS_CREATE_OWN: 'appointments:create:own',
  APPOINTMENTS_CANCEL_OWN: 'appointments:cancel:own',
  APPOINTMENTS_MANAGE: 'appointments:manage',
  // roles
  ROLES_READ: 'roles:read',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  ROLES_RESTORE: 'roles:restore',
  ROLES_DELETE_PERMANENT: 'roles:delete:permanent',
  // schedules
  SCHEDULES_CREATE_OWN: 'schedules:create:own',
  SCHEDULES_READ_OWN: 'schedules:read:own',
  SCHEDULES_UPDATE_OWN: 'schedules:update:own',
  SCHEDULES_DELETE_OWN: 'schedules:delete:own',
  SCHEDULES_MANAGE: 'schedules:manage',
  // medical records
  MEDICAL_RECORDS_READ: 'medical-records:read',
  MEDICAL_RECORDS_CREATE: 'medical-records:create',
  MEDICAL_RECORDS_UPDATE: 'medical-records:update',
  MEDICAL_RECORDS_DELETE: 'medical-records:delete',
  MEDICAL_RECORDS_SIGN: 'medical-records:sign',
  MEDICAL_RECORDS_READ_OWN: 'medical-records:read:own',
  // reports
  REPORTS_READ: 'reports:read',
  REPORTS_GENERATE: 'reports:generate',
  REPORTS_EXPORT: 'reports:export',
  // audit
  AUDIT_READ: 'audit:read',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
