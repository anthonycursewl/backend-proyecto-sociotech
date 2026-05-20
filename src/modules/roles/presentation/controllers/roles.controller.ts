import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleService } from '../../application/services/role.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AddPermissionDto,
  SetPermissionsDto,
} from './role.dto';
import { RolesGuard } from '@shared/guards/roles.guard';
import { Roles } from '@shared/decorators/roles.decorator';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { Audit } from '../../../audit/audit.decorator';
import { AuditInterceptor } from '../../../audit/audit.interceptor';

@Controller('roles')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(AuditInterceptor)
export class RolesController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('roles', 'read')
  async findAll(@Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit) : undefined;
    return this.roleService.findManyCursor(cursor, parsedLimit);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('roles', 'read')
  async findDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.roleService.findDetail(id);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('roles', 'create')
  @Audit('roles:create', 'Role')
  async create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('roles', 'update')
  @Audit('roles:update', 'Role', true)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @Req() req,
  ) {
    const old = await this.roleService.findById(id);
    (req as any).auditSnapshot = { id: old.id, name: old.name, description: old.description, isSystem: old.isSystem };
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('roles', 'delete')
  @Audit('roles:delete', 'Role', true)
  async softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req,
  ) {
    const old = await this.roleService.findById(id);
    (req as any).auditSnapshot = { id: old.id, name: old.name, description: old.description, isSystem: old.isSystem };
    return this.roleService.delete(id);
  }

  @Get('trash')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('roles', 'read')
  async getTrashed() {
    return this.roleService.getTrashed();
  }

  @Post('trash/:id/restore')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('roles', 'restore')
  @Audit('roles:restore', 'Role')
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.roleService.restore(id);
  }

  @Delete('trash/:id/permanent')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('roles', 'delete:permanent')
  @Audit('roles:permanent-delete', 'Role')
  async permanentDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.roleService.permanentDelete(id);
  }

  @Post(':id/permissions')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('roles', 'update')
  @Audit('roles:update', 'Role')
  async addPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPermissionDto,
  ) {
    return this.roleService.addPermission(id, dto.permissionId);
  }

  @Put(':id/permissions')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('roles', 'update')
  @Audit('roles:update', 'Role')
  async setPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPermissionsDto,
  ) {
    return this.roleService.setPermissions(id, dto.permissionIds);
  }

  @Delete(':id/permissions/:permissionId')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('roles', 'update')
  @Audit('roles:update', 'Role')
  async removePermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ) {
    return this.roleService.removePermission(id, permissionId);
  }
}
