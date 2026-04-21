import { Controller, Get, Put, Delete, Param, Body, UseGuards, ParseUUIDPipe, Inject, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@identity/domain/entities/user.entity';
import type { UserRepository } from '@identity/domain/ports/user-repository.port';
import { USER_REPOSITORY } from '@identity/domain/ports/user-repository.port';
import { RolesGuard } from '@identity/infrastructure/strategies/roles.guard';
import { Roles } from '@identity/infrastructure/strategies/roles.decorator';
import { UserRole } from '@identity/domain/entities/user.entity';

class UpdateRoleDto {
  role: UserRole;
}

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  @Put(':id/role')
  @Roles(UserRole.ADMIN)
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.changeRole(dto.role);
    return this.userRepository.update(user);
  }

  @Put(':id/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.deactivate();
    return this.userRepository.update(user);
  }

  @Put(':id/activate')
  @Roles(UserRole.ADMIN)
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.activate();
    return this.userRepository.update(user);
  }
}