import { Prisma } from '@prisma/client';

export interface IUnitOfWork {
  execute<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>;
}
