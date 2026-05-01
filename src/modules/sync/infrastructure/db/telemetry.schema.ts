import { Schema, Document } from 'mongoose';

export interface Telemetry {
  eventType: string;
  entityType: string;
  entityId: string;
  userId: string;
  timestamp: Date;
  payload?: Record<string, any>;
}

export type TelemetryDocument = Telemetry & Document;

export const TelemetrySchema = new Schema<TelemetryDocument>({
  eventType: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  payload: { type: Schema.Types.Mixed },
}, { collection: 'telemetry' });
