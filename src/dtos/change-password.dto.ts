import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Current password cannot be empty' })
  @Matches(/\S/, { message: 'Password must not be only whitespace' })
  password: string;

  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must contain at least 6 characters' })
  @MaxLength(30, { message: 'Password must contain at most 30 characters' })
  @Matches(/(?=.*[a-z])/, {
    message: 'Password must contain at least 1 lower case letter',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Password must contain at least 1 capital letter',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Password must contain at least 1 digit',
  })
  @Matches(/(?=.*[!@#$%^&*()\-_=+{};:,<.>])/, {
    message: 'Password must contain at least 1 special character',
  })
  newPassword: string;
}
