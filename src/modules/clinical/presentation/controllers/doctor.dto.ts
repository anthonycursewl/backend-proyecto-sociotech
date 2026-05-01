import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsPositive } from 'class-validator';

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
  @IsString()
  isActive?: boolean;
}
