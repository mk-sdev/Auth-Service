import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class EmailDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  email: string;
}
