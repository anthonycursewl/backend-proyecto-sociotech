import { Controller, Get, Post, Put, Param, Body, UseGuards, ParseUUIDPipe, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { User } from '@identity/domain/entities/user.entity';
import { Permission, IMMUTABLE_ROLES, UserRole } from '@identity/domain/entities/user.entity';
import type { UserRepository } from '@identity/domain/ports/user-repository.port';
import { USER_REPOSITORY } from '@identity/domain/ports/user-repository.port';
import { RolesGuard } from '@identity/infrastructure/strategies/roles.guard';
import { Permissions } from '@identity/infrastructure/strategies/permissions.decorator';
import { CurrentUser } from '@identity/infrastructure/strategies/current-user.decorator';
import { RegisterUserUseCase } from '../../application/services/register-user.usecase';
import { CreateUserDto, UpdateRoleDto } from './users.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    private readonly registerUserUseCase: RegisterUserUseCase,
  ) { }

  @Post()
  @Permissions(Permission.USER_CREATE)
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    if (dto.role) {
      return this.registerUserUseCase.executeWithRole(dto, currentUser);
    }
    return this.registerUserUseCase.execute(dto);
  }

  @Get()
  @Permissions(Permission.USER_LIST)
  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  @Get('me')
  @Permissions(Permission.USER_READ)
  async findMe(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Get(':id')
  @Permissions(Permission.USER_READ)
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  @Get('email/:email')
  @Permissions(Permission.USER_READ)
  async findByEmail(@Param('email') email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  @Put(':id/role')
  @Permissions(Permission.USER_ASSIGN_ROLE)
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!currentUser.canAssignRole(dto.role)) {
      throw new ForbiddenException(`Cannot assign ${dto.role} role`);
    }

    if (IMMUTABLE_ROLES.includes(user.role)) {
      throw new ForbiddenException(`Cannot change ${user.role} role`);
    }

    user.changeRole(dto.role);
    return this.userRepository.update(user);
  }

  @Put(':id/deactivate')
  @Permissions(Permission.USER_UPDATE)
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (currentUser.id === user.id) {
      throw new ForbiddenException('Cannot deactivate yourself');
    }

    user.deactivate();
    return this.userRepository.update(user);
  }

  @Put(':id/activate')
  @Permissions(Permission.USER_UPDATE)
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.activate();
    return this.userRepository.update(user);
  }
}