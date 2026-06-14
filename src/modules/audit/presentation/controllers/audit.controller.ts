import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from '../../../flusher/schemas/audit-log.schema';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';

function tryParse(value: unknown): unknown {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function normalizeDoc(doc: Record<string, unknown>): Record<string, unknown> {
  const parsed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    parsed[key] = tryParse(value);
  }
  return parsed;
}

@Controller('audit-logs')
@UseGuards(AuthGuard('jwt'))
export class AuditController {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
  ) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('audit', 'read')
  async findAll(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const take = Math.min(parseInt(limit || '20'), 100);
    const filter: Record<string, unknown> = {};
    if (action) filter.action = action;
    if (userId) filter['actor.userId'] = userId;
    if (resourceType) filter['resource.type'] = resourceType;
    if (resourceId) filter['resource.id'] = resourceId;

    if (from || to) {
      const timestampFilter: Record<string, Date> = {};
      if (from) {
        const d = new Date(from);
        if (!isNaN(d.getTime())) timestampFilter.$gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!isNaN(d.getTime())) timestampFilter.$lte = d;
      }
      if (Object.keys(timestampFilter).length > 0) {
        filter.timestamp = timestampFilter;
      }
    }

    const docs = await this.auditLogModel
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(take + 1)
      .lean();

    const hasMore = docs.length > take;
    if (hasMore) docs.pop();

    return {
      data: docs.map((d) =>
        normalizeDoc(d as unknown as Record<string, unknown>),
      ),
      nextCursor: hasMore ? String((docs[docs.length - 1] as any)?._id) : null,
      hasMore,
    };
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('audit', 'read')
  async findById(@Param('id') id: string) {
    const doc = await this.auditLogModel.findById(id).lean();
    if (!doc) {
      throw new NotFoundException('Registro de auditoría no encontrado');
    }
    return { data: normalizeDoc(doc as unknown as Record<string, unknown>) };
  }
}
