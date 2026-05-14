import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditOptions {
  action: string;
  resourceType: string;
  includeChanges?: boolean;
}

export const Audit = (
  action: string,
  resourceType: string,
  includeChanges = false,
) => SetMetadata(AUDIT_KEY, { action, resourceType, includeChanges });
