import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PatientPrismaService } from '../../infrastructure/db/prisma.service';

const METRICS_ID = '00000000-0000-0000-0000-000000000001';

export interface PatientMetricsData {
  totalActive: number;
  totalInactive: number;
  totalNew: number;
  updatedAt: Date;
}

@Injectable()
export class PatientMetricsService {
  constructor(
    @Inject(PatientPrismaService) private readonly prisma: PatientPrismaService,
  ) {}

  async getMetrics(): Promise<PatientMetricsData> {
    const row = await this.prisma.patientMetrics.findUnique({
      where: { id: METRICS_ID },
    });

    if (row) {
      return {
        totalActive: row.totalActive,
        totalInactive: row.totalInactive,
        totalNew: row.totalNew,
        updatedAt: row.updatedAt,
      };
    }

    return this.refresh();
  }

  async refresh(): Promise<PatientMetricsData> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalActive, totalInactive, totalNew] = await Promise.all([
      this.prisma.patient.count({
        where: { user: { isActive: true } },
      }),
      this.prisma.patient.count({
        where: { user: { isActive: false } },
      }),
      this.prisma.patient.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    const row = await this.prisma.patientMetrics.upsert({
      where: { id: METRICS_ID },
      create: {
        id: METRICS_ID,
        totalActive,
        totalInactive,
        totalNew,
      },
      update: {
        totalActive,
        totalInactive,
        totalNew,
      },
    });

    return {
      totalActive: row.totalActive,
      totalInactive: row.totalInactive,
      totalNew: row.totalNew,
      updatedAt: row.updatedAt,
    };
  }
}
