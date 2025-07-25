import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  email: string;

  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  @Matches(/\S/, { message: 'Password must not be only whitespace' })
  password: string;
}
