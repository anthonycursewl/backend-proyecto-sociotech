export const AUDIT_REPOSITORY = Symbol('AUDIT_REPOSITORY');

export interface AuditLogEntry {
  id?: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
}

export interface AuditRepository {
  log(entry: AuditLogEntry): Promise<void>;
  findByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]>;
  findByUserId(userId: string, limit?: number): Promise<AuditLogEntry[]>;
}