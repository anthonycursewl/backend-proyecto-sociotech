import { Injectable } from '@nestjs/common';
import { User, UserProps, UserRole } from '@identity/domain/entities/user.entity';
import { UserRepository } from '@identity/domain/ports/user-repository.port';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(prismaUser: any, includePassword = true): User {
    return new User({
      id: prismaUser.id,
      email: prismaUser.email,
      passwordHash: includePassword ? prismaUser.passwordHash : '',
      role: prismaUser.role as UserRole,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      isActive: prismaUser.isActive,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }

  async save(user: User): Promise<User> {
    const prismaUser = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
    return this.toDomain(prismaUser);
  }

  async findById(id: string, includePassword = true): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { id },
      select: includePassword ? undefined : { id: true, email: true, role: true, firstName: true, lastName: true, isActive: true, createdAt: true, updatedAt: true },
    });
    return prismaUser ? this.toDomain(prismaUser, includePassword) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({ where: { email } });
    return prismaUser ? this.toDomain(prismaUser, true) : null;
  }

  async findAll(): Promise<User[]> {
    const prismaUsers = await this.prisma.user.findMany();
    return prismaUsers.map((u) => this.toDomain(u, true));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async update(user: User): Promise<User> {
    const prismaUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(prismaUser);
  }
}