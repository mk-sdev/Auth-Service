import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { UserRequest, Role } from './utils/interfaces';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!allowedRoles) return true;

    const request = context.switchToHttp().getRequest<UserRequest>();
    const userRoles = request.user?.roles;

    if (!userRoles || !userRoles.some((r) => allowedRoles.includes(r))) {
      throw new UnauthorizedException('Forbidden');
    }

    return true;
  }
}
