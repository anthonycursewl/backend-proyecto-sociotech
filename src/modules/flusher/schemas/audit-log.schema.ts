import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({
  collection: 'audit_logs',
  timestamps: { createdAt: true, updatedAt: false },
})
export class AuditLog {
  @Prop({ required: true, unique: true })
  eventId: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: Object, required: true })
  actor: {
    userId: string;
    email: string;
    roleName: string;
  } | null;

  @Prop({ required: true })
  action: string;

  @Prop({ type: Object, required: true })
  resource: {
    type: string;
    id: string | null;
  };

  @Prop({ type: Object, required: true })
  context: {
    ip: string;
    userAgent: string;
    method: string;
    path: string;
  };

  @Prop({ type: Object, default: null })
  changes: {
    old: Record<string, unknown> | null;
    new: Record<string, unknown> | null;
  } | null;

  @Prop({ required: true })
  result: string;

  @Prop({ type: String, default: null })
  errorMessage: string | null;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ 'actor.userId': 1 });
AuditLogSchema.index({ 'resource.type': 1, 'resource.id': 1 });
