import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueModule } from '../queue/queue.module';
import { FlusherService } from './flusher.service';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { TelemetryRecord, TelemetrySchema } from './schemas/telemetry.schema';

@Module({
  imports: [
    QueueModule,
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: TelemetryRecord.name, schema: TelemetrySchema },
    ]),
  ],
  providers: [FlusherService],
})
export class FlusherModule {}
