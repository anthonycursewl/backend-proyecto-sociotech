import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { IUnitOfWork } from './unit-of-work.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  async execute<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return work(tx);
    });
  }
}
