import { UnauthorizedException } from '@nestjs/common';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({
      statusCode: 401,
      message: 'Invalid email or password.',
      code: 'INVALID_CREDENTIALS',
    });
  }
}
