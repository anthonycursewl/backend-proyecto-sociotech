import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type TelemetryDocument = HydratedDocument<TelemetryRecord>;

@Schema({
  collection: 'telemetry',
  timestamps: { createdAt: true, updatedAt: false },
})
export class TelemetryRecord {
  @Prop({ required: true, unique: true })
  eventId: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  endpoint: string;

  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  statusCode: number;

  @Prop({ required: true })
  durationMs: number;

  @Prop({ type: String, default: null })
  userId: string | null;

  @Prop({ type: String, default: null })
  roleName: string | null;

  @Prop({ type: String, default: null })
  errorType: string | null;
}

export const TelemetrySchema = SchemaFactory.createForClass(TelemetryRecord);
TelemetrySchema.index({ timestamp: -1 });
TelemetrySchema.index({ endpoint: 1, timestamp: -1 });
TelemetrySchema.index({ statusCode: 1 });
