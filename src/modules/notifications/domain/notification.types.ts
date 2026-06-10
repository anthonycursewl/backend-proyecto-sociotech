export const NOTIFICATION_STREAM = 'notifications:stream';
export const NOTIFICATION_GROUP = 'notification-group';
export const NOTIFICATION_CONSUMER = 'notification-1';
export const DLQ_STREAM = 'notifications:dlq';
export const DLQ_GROUP = 'notification-dlq-group';
export const DLQ_CONSUMER = 'notification-dlq-1';

export const BACKOFF_BASE_MS = 1000;
export const BACKOFF_MAX_MS = 30000;
export const POLL_INTERVAL_MS = 1500;
export const BATCH_SIZE = 10;
export const RATE_LIMIT_MAX_PER_MINUTE = 30;
export const OTP_EXPIRES_MINUTES = 10;
export const OTP_CODE_LENGTH = 6;

export enum NotificationType {
  APPOINTMENT_SCHEDULED = 'APPOINTMENT_SCHEDULED',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  USER_REGISTERED = 'USER_REGISTERED',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  LOGIN_DETECTED = 'LOGIN_DETECTED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DLQ = 'DLQ',
}

export interface NotificationEvent {
  type: NotificationType;
  appointmentId?: string;
  patientId?: string;
  doctorId?: string;
  serviceId?: string;
  userId?: string;
  scheduledAt?: string;
  reason?: string;
  oldDate?: string;
  serviceName?: string;
  email?: string;
  name?: string;
  code?: string;
  expiresInMinutes?: number;
}

export interface MetricsData {
  queueDepth: number;
  dlqDepth: number;
  sentToday: number;
  failedToday: number;
  dlqToday: number;
  lastProcessedAt: Date | null;
  avgProcessTimeMs: number;
}

export function calculateBackoffMs(retryCount: number): number {
  const delay = BACKOFF_BASE_MS * 2 ** retryCount;
  return Math.min(delay, BACKOFF_MAX_MS);
}
