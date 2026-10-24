import { IsNotEmpty, IsString } from 'class-validator';
import { LoginDto } from './login.dto';

export class AdminLoginDto extends LoginDto {
  @IsString({ message: 'CAPTCHA token is required' })
  @IsNotEmpty({ message: 'CAPTCHA token is required' })
  captchaToken: string;
}
