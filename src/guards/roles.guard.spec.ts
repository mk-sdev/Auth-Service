import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRequest, Role } from '../utils/interfaces';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockExecutionContext = (roles?: Role[]): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: (): Partial<UserRequest> => ({
          user: roles
            ? {
                sub: 'test',
                iat: Date.now(),
                exp: Date.now() + 10000,
                roles,
              }
            : undefined,
        }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined); // no @Roles

    const context = mockExecutionContext([Role.ADMIN]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has at least one matching role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = mockExecutionContext([Role.ADMIN, Role.MODERATOR]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user has no matching role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = mockExecutionContext([Role.MODERATOR]);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should deny access if user has no roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = mockExecutionContext([]);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should deny access if user is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = mockExecutionContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
