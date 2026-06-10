import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  IsPositive,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty()
  specialty: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationPrice?: number;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class UpdateDoctorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  specialty?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  licenseNumber?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationPrice?: number;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}
