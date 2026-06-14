import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { User, UserProps } from '../../domain/entities/user.entity';
import {
  UserRepository,
  UserSummary,
  PaginatedUsers,
} from '../../domain/repositories/user-repository.port';
import { PrismaService } from '../db/prisma.service';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  PROTECTED_ROLES,
  RoleName,
} from '@shared/constants';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(prismaUser: any, includePassword = true): User {
    return new User({
      id: prismaUser.id,
      email: prismaUser.email,
      passwordHash: includePassword ? prismaUser.passwordHash : '',
      roleId: prismaUser.roleId,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      isActive: prismaUser.isActive,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      roleName: prismaUser.role?.name,
      permissions:
        prismaUser.role?.permissions?.map((rp: any) => rp.permission.name) ||
        [],
    });
  }

  private toSummary(prismaUser: any): UserSummary {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      roleId: prismaUser.roleId,
      roleName: prismaUser.role?.name || '',
      isActive: prismaUser.isActive,
      createdAt: prismaUser.createdAt,
    };
  }

  async save(user: User): Promise<User> {
    const prismaUser = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        roleId: user.roleId,
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

  async findByIdWithRole(id: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
    return prismaUser ? this.toDomain(prismaUser, false) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
    return prismaUser ? this.toDomain(prismaUser, true) : null;
  }

  async findAll(): Promise<User[]> {
    const prismaUsers = await this.prisma.user.findMany({
      include: {
        role: true,
      },
    });
    return prismaUsers.map((u) => this.toDomain(u, true));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.passwordHash) updateData.passwordHash = data.passwordHash;
    if (data.roleId) updateData.roleId = data.roleId;
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const prismaUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
    return this.toDomain(prismaUser, false);
  }

  async updateRoleId(id: string, roleId: string): Promise<User> {
    const prismaUser = await this.prisma.user.update({
      where: { id },
      data: { roleId },
      include: { role: true },
    });
    return this.toDomain(prismaUser, false);
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
    expires?: Date,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        refreshToken,
        refreshTokenExpires: expires,
      },
    });
  }

  async search(query: string, limit = DEFAULT_PAGE_SIZE): Promise<User[]> {
    const prismaUsers = await this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: { role: true },
    });
    return prismaUsers.map((u) => this.toDomain(u, true));
  }

  async findDefaultPatientRoleId(): Promise<string | null> {
    const role = await this.prisma.role.findUnique({
      where: { name: RoleName.PATIENT },
    });
    return role?.id || null;
  }

  async findManyCursor(
    cursor?: string,
    limit = DEFAULT_PAGE_SIZE,
    isActive?: boolean,
  ): Promise<PaginatedUsers> {
    const take = Math.min(limit, MAX_PAGE_SIZE);
    const where: any = cursor ? { id: { lt: cursor } } : {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const users = await this.prisma.user.findMany({
      where,
      take: take + 1,
      orderBy: { id: 'desc' },
      include: { role: true },
    });

    const hasNext = users.length > take;
    if (hasNext) {
      users.pop();
    }

    const nextCursor = hasNext ? (users[users.length - 1]?.id ?? null) : null;

    return {
      users: users.map((u) => this.toSummary(u)),
      nextCursor,
      hasNext,
    };
  }

  async findPatientsCursor(
    cursor?: string,
    limit = DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedUsers> {
    const take = Math.min(limit, MAX_PAGE_SIZE);
    const where: any = cursor ? { id: { lt: cursor } } : {};
    where.role = { name: RoleName.PATIENT };

    const users = await this.prisma.user.findMany({
      where,
      take: take + 1,
      orderBy: { id: 'desc' },
      include: { role: true },
    });

    const hasNext = users.length > take;
    if (hasNext) {
      users.pop();
    }

    const nextCursor = hasNext ? (users[users.length - 1]?.id ?? null) : null;

    return {
      users: users.map((u) => this.toSummary(u)),
      nextCursor,
      hasNext,
    };
  }

  async findDoctorsCursor(
    cursor?: string,
    limit = DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedUsers> {
    const take = Math.min(limit, MAX_PAGE_SIZE);
    const where: any = cursor ? { id: { lt: cursor } } : {};
    where.role = { name: RoleName.DOCTOR };

    const users = await this.prisma.user.findMany({
      where,
      take: take + 1,
      orderBy: { id: 'desc' },
      include: { role: true },
    });

    const hasNext = users.length > take;
    if (hasNext) {
      users.pop();
    }

    const nextCursor = hasNext ? (users[users.length - 1]?.id ?? null) : null;

    return {
      users: users.map((u) => this.toSummary(u)),
      nextCursor,
      hasNext,
    };
  }

  async toggleActive(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const protectedRoles = PROTECTED_ROLES;
    if (protectedRoles.includes(user.role.name)) {
      throw new ForbiddenException(
        `No se puede desactivar usuario con rol ${user.role.name}`,
      );
    }

    const prismaUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
    return this.toDomain(prismaUser, false);
  }

  async assignRole(
    id: string,
    roleId: string,
    requesterUserId: string,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const protectedRoles = PROTECTED_ROLES;
    if (protectedRoles.includes(user.role.name)) {
      throw new ForbiddenException(
        `No se puede cambiar el rol del usuario con rol ${user.role.name}`,
      );
    }

    if (id === requesterUserId) {
      throw new ForbiddenException('No puedes cambiar tu propio rol');
    }

    const targetRole = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!targetRole) {
      throw new NotFoundException('Rol destino no encontrado');
    }

    if (protectedRoles.includes(targetRole.name)) {
      throw new ForbiddenException(
        `No se puede asignar el rol ${targetRole.name} a través de este endpoint`,
      );
    }

    const prismaUser = await this.prisma.user.update({
      where: { id },
      data: { roleId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
    return this.toDomain(prismaUser, false);
  }
}
