import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { Provider, Role } from '../utils/interfaces';

// dto without sensitive data; therefore it's "safe"
export class SafeUserDto {
  @IsNotEmpty({ message: 'ID cannot be empty' })
  @IsString({ message: 'ID must be a string' })
  _id: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  email: string;

  @IsArray({ message: 'Roles must be an array' })
  @ArrayNotEmpty({ message: 'Roles array cannot be empty' })
  @IsEnum(Role, { each: true, message: 'Each role must be a valid Role' })
  roles: Role[];

  @IsBoolean({ message: 'isVerified must be a boolean' })
  isVerified: boolean;

  @IsEnum(Provider)
  provider: Provider;
}
