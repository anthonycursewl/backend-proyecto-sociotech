import { Expose } from 'class-transformer';
import { UserRole, Permission } from '@identity/domain/entities/user.entity';

export class UserDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  passwordHash!: string;

  @Expose()
  role!: UserRole;

  @Expose()
  firstName!: string;

  @Expose()
  lastName!: string;

  @Expose()
  isActive!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}

export class UserMetadata {
  @Expose()
  fullName!: string;

  @Expose()
  humanReadable!: string;

  @Expose()
  permissions!: Permission[];
}

export class ProfileResponseDto {
  @Expose()
  user!: UserDto;

  @Expose()
  metadata!: UserMetadata;
}