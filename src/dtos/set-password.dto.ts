import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SetPasswordDto {
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
  password: string;
}
