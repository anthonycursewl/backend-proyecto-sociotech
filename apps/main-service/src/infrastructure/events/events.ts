export enum StreamNames {
  USER_EVENTS = 'stream:user_events',
  APPOINTMENT_EVENTS = 'stream:appointment_events',
  MEDICAL_RECORD_EVENTS = 'stream:medical_record_events',
  AUDIT_EVENTS = 'stream:audit_events',
  SYNC_EVENTS = 'stream:sync_events',
}

export enum EventTypes {
  // User events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  
  // Appointment events
  APPOINTMENT_SCHEDULED = 'APPOINTMENT_SCHEDULED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  
  // Medical record events
  MEDICAL_RECORD_CREATED = 'MEDICAL_RECORD_CREATED',
  MEDICAL_RECORD_SIGNED = 'MEDICAL_RECORD_SIGNED',
  
  // Audit events
  AUDIT_LOG_CREATED = 'AUDIT_LOG_CREATED',
}
