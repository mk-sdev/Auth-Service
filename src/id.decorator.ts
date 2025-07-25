import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRequest } from './utils/interfaces';

export const Id = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request: UserRequest = ctx.switchToHttp().getRequest();
    const id = request.user?.sub;

    if (!id) {
      throw new UnauthorizedException('User ID not found in token');
    }

    return id;
  },
);
