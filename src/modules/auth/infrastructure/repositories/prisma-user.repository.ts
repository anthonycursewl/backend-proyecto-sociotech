import { Injectable } from '@nestjs/common';
import { User, UserProps, UserRole } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user-repository.port';
import { PrismaService } from '../db/prisma.service';

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
      refreshToken: prismaUser.refreshToken,
      refreshTokenExpires: prismaUser.refreshTokenExpires,
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

  async update(id: string, data: Partial<User>): Promise<User> {
    const prismaUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.passwordHash && { passwordHash: data.passwordHash }),
        ...(data.role && { role: data.role }),
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(prismaUser);
  }

  async updateRefreshToken(userId: string, hashedRefreshToken: string, expiresAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: hashedRefreshToken,
        refreshTokenExpires: expiresAt,
        updatedAt: new Date(),
      },
    });
  }

  async findByRole(role: string): Promise<User[]> {
    const prismaUsers = await this.prisma.user.findMany({
      where: { role },
    });
    return prismaUsers.map((u) => this.toDomain(u, true));
  }

  async search(query: string, limit = 20): Promise<User[]> {
    const prismaUsers = await this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });
    return prismaUsers.map((u) => this.toDomain(u, true));
  }
}
