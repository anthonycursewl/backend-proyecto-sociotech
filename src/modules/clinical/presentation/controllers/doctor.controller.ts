import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DoctorService } from '@clinical/application/services/doctor.service';
import { CreateDoctorDto, UpdateDoctorDto } from '@clinical/presentation/controllers/doctor.dto';

@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() dto: CreateDoctorDto, @Req() req) {
    return this.doctorService.create(req.user.userId, dto);
  }

  @Get()
  async findAll(@Query('includeInactive') includeInactive: string) {
    const include = includeInactive === 'true';
    return this.doctorService.findAll(include);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.doctorService.findById(id);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.doctorService.findByUserId(userId);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id') id: string) {
    return this.doctorService.delete(id);
  }
}
