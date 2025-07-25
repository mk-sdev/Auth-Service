import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, UserRequest } from '../utils/interfaces';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    @Inject('JWT_ACCESS_SERVICE')
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<UserRequest>();

    // 1. Check JWT in cookies
    let token: string | undefined = request.cookies?.access_token as string;

    // 2. Check JWT in headers
    if (!token) {
      const authHeader = request.headers['authorization'];
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    // 3. If JWT still not found - deny access
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // 4. Verify the token
    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token);
      request.user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
