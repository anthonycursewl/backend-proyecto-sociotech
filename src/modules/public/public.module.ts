import { Module } from '@nestjs/common';
import { PublicController } from './presentation/controllers/public.controller';
import { ClinicalModule } from '../clinical/clinical.module';
import { ServicesModule } from '../services/services.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [ClinicalModule, ServicesModule, AppointmentsModule],
  controllers: [PublicController],
})
export class PublicModule {}
