import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');

@Injectable({ scope: Scope.REQUEST })
export class UnitOfWork {
  private prisma: PrismaService;

  constructor(private readonly prismaService: PrismaService) {
    this.prisma = prismaService;
  }

  async transaction<T>(fn: (tx: PrismaService) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  getPrisma(): PrismaService {
    return this.prisma;
  }
}