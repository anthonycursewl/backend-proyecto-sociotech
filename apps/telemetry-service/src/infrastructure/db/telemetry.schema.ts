import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TelemetryDocument = Telemetry & Document;

@Schema({ timestamps: true })
export class Telemetry {
  @Prop({ required: true })
  eventType!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop()
  entityType?: string;

  @Prop()
  entityId?: string;

  @Prop({ type: Object })
  payload?: Record<string, any>;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  endpoint?: string;

  @Prop()
  method?: string;

  @Prop({ default: Date.now })
  timestamp!: Date;
}

export const TelemetrySchema = SchemaFactory.createForClass(Telemetry);

TelemetrySchema.index({ eventType: 1, timestamp: -1 });
TelemetrySchema.index({ userId: 1, timestamp: -1 });
TelemetrySchema.index({ entityType: 1, entityId: 1 });
