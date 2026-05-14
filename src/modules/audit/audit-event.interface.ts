export interface AuditEvent {
  eventId: string;
  timestamp: string;
  actor: {
    userId: string;
    email: string;
    roleName: string;
  } | null;
  action: string;
  resource: {
    type: string;
    id: string | null;
  };
  context: {
    ip: string;
    userAgent: string;
    method: string;
    path: string;
  };
  changes: {
    old: Record<string, unknown> | null;
    new: Record<string, unknown> | null;
  } | null;
  result: 'success' | 'failure';
  errorMessage: string | null;
}
