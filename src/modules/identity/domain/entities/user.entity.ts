export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  SECRETARY = 'SECRETARY',
  PATIENT = 'PATIENT',
}

export enum Permission {
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_LIST = 'user:list',
  USER_ASSIGN_ROLE = 'user:assign_role',
  
  PATIENT_CREATE = 'patient:create',
  PATIENT_READ = 'patient:read',
  PATIENT_UPDATE = 'patient:update',
  PATIENT_DELETE = 'patient:delete',
  PATIENT_LIST = 'patient:list',
  
  MEDICAL_RECORD_CREATE = 'medical_record:create',
  MEDICAL_RECORD_READ = 'medical_record:read',
  MEDICAL_RECORD_UPDATE = 'medical_record:update',
  MEDICAL_RECORD_DELETE = 'medical_record:delete',
  MEDICAL_RECORD_SIGN = 'medical_record:sign',
  MEDICAL_RECORD_EXPORT_PDF = 'medical_record:export_pdf',
  
  APPOINTMENT_CREATE = 'appointment:create',
  APPOINTMENT_READ = 'appointment:read',
  APPOINTMENT_UPDATE = 'appointment:update',
  APPOINTMENT_DELETE = 'appointment:delete',
  APPOINTMENT_CANCEL = 'appointment:cancel',
  APPOINTMENT_RESCHEDULE = 'appointment:reschedule',
  
  REPORT_GENERATE = 'report:generate',
  AUDIT_READ = 'audit:read',
  
  SYSTEM_CONFIG = 'system:config',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_LIST,
    Permission.USER_ASSIGN_ROLE,
    Permission.PATIENT_CREATE,
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.PATIENT_DELETE,
    Permission.PATIENT_LIST,
    Permission.MEDICAL_RECORD_CREATE,
    Permission.MEDICAL_RECORD_READ,
    Permission.MEDICAL_RECORD_UPDATE,
    Permission.MEDICAL_RECORD_DELETE,
    Permission.MEDICAL_RECORD_SIGN,
    Permission.MEDICAL_RECORD_EXPORT_PDF,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ,
    Permission.APPOINTMENT_UPDATE,
    Permission.APPOINTMENT_DELETE,
    Permission.APPOINTMENT_CANCEL,
    Permission.APPOINTMENT_RESCHEDULE,
    Permission.REPORT_GENERATE,
    Permission.AUDIT_READ,
    Permission.SYSTEM_CONFIG,
  ],
  [UserRole.ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_LIST,
    Permission.USER_ASSIGN_ROLE,
    Permission.PATIENT_CREATE,
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.PATIENT_DELETE,
    Permission.PATIENT_LIST,
    Permission.MEDICAL_RECORD_CREATE,
    Permission.MEDICAL_RECORD_READ,
    Permission.MEDICAL_RECORD_UPDATE,
    Permission.MEDICAL_RECORD_DELETE,
    Permission.MEDICAL_RECORD_SIGN,
    Permission.MEDICAL_RECORD_EXPORT_PDF,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ,
    Permission.APPOINTMENT_UPDATE,
    Permission.APPOINTMENT_DELETE,
    Permission.APPOINTMENT_CANCEL,
    Permission.APPOINTMENT_RESCHEDULE,
    Permission.REPORT_GENERATE,
    Permission.AUDIT_READ,
  ],
  [UserRole.DOCTOR]: [
    Permission.PATIENT_READ,
    Permission.PATIENT_LIST,
    Permission.MEDICAL_RECORD_CREATE,
    Permission.MEDICAL_RECORD_READ,
    Permission.MEDICAL_RECORD_UPDATE,
    Permission.MEDICAL_RECORD_SIGN,
    Permission.MEDICAL_RECORD_EXPORT_PDF,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ,
    Permission.APPOINTMENT_UPDATE,
    Permission.APPOINTMENT_CANCEL,
    Permission.APPOINTMENT_RESCHEDULE,
    Permission.REPORT_GENERATE,
  ],
  [UserRole.SECRETARY]: [
    Permission.USER_READ,
    Permission.USER_LIST,
    Permission.PATIENT_CREATE,
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.PATIENT_LIST,
    Permission.MEDICAL_RECORD_READ,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ,
    Permission.APPOINTMENT_UPDATE,
    Permission.APPOINTMENT_DELETE,
    Permission.APPOINTMENT_CANCEL,
    Permission.APPOINTMENT_RESCHEDULE,
  ],
  [UserRole.PATIENT]: [
    Permission.PATIENT_READ,
    Permission.MEDICAL_RECORD_READ,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ,
  ],
};

export const IMMUTABLE_ROLES = [UserRole.OWNER];

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private readonly props: UserProps;

  constructor(props: UserProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  hasPermission(permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[this.props.role];
    return permissions.includes(permission);
  }

  canAssignRole(targetRole: UserRole): boolean {
    if (this.props.role === UserRole.OWNER) {
      return targetRole !== UserRole.OWNER;
    }
    if (this.props.role === UserRole.ADMIN) {
      return targetRole !== UserRole.OWNER && targetRole !== UserRole.ADMIN;
    }
    return false;
  }

  deactivate(): void {
    if (this.props.role === UserRole.OWNER) {
      throw new Error('Cannot deactivate OWNER role');
    }
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  changeRole(newRole: UserRole): void {
    if (IMMUTABLE_ROLES.includes(this.props.role)) {
      throw new Error(`Cannot change role from ${this.props.role}`);
    }
    if (IMMUTABLE_ROLES.includes(newRole)) {
      throw new Error(`Cannot assign ${newRole} role`);
    }
    this.props.role = newRole;
    this.props.updatedAt = new Date();
  }

  toPlain(): UserProps {
    return { ...this.props };
  }
}