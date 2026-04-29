import { Module } from '@nestjs/common';
import { PrismaService } from './infrastructure/db/prisma.service';

@Module({
  imports: [],
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class MainServiceModule {}
