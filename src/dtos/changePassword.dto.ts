import { IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Current password cannot be empty' })
  password: string;

  @IsNotEmpty({ message: 'Password cannot be empty' })
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
