import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { JwtGuard } from './jwt.guard';
import { JwtPayload, Role } from '../utils/interfaces';

const createMockContext = (
  cookies?: Record<string, string>,
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        cookies: cookies ?? {},
      }),
    }),
  }) as unknown as ExecutionContext;

describe('JwtGuard', () => {
  let jwtService: JwtService;
  let guard: JwtGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: 'JWT_ACCESS_SERVICE',
          useFactory: () => {
            return new JwtService({
              secret: 'testingsecret',
            });
          },
        },
        JwtGuard,
      ],
    }).compile();
    jwtService = module.get<JwtService>('JWT_ACCESS_SERVICE');
    guard = module.get<JwtGuard>(JwtGuard);
  });

  it('should return true for valid token', async () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODZkMDIxZGY5NTEwNDI4ZDQyYmNkOTQiLCJpYXQiOjE3NTIwNDkwMTQsImV4cCI6MzMyNzgwOTE0MTR9.o2hFMNL9IaFDD05sJYEDwUicW-bsretWzgubJe3IHg8';

    const context = createMockContext({ access_token: token });

    const expectedPayload: JwtPayload = {
      sub: '686d021df9510428d42bcd94',
      roles: [Role.USER],
      iat: 1752049014,
      exp: 33278091414, // 999 years
    };

    const payload: JwtPayload = await jwtService.verifyAsync(token);
    expect(payload).toEqual(expectedPayload);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException if secret is invalid', async () => {
    const invalidToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODZkMDIxZGY5NTEwNDI4ZDQyYmNkOTQiLCJpYXQiOjE3NTIwNDk0NTksImV4cCI6MzMyNzgwOTE4NTl9.iqAkno2HJW6J1-A3do50hs95diMRaDljyyzR0Ii2EU4'; // secret: wrongsecret

    const context = createMockContext({ access_token: invalidToken });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if jwt has been altered', async () => {
    const alteredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODZkMDIxZGY5NTEwNDI4ZDQyYmNkOTQiLCJpYXQiOjE3NTIwNDk4MTMsImV4cCI6MzMyNzgwOsTIyMTN9.YJy0_zD-wIYXwNEfwDSVOjaCTwm7EhXC0B1dZ-FsWUI';

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          cookies: {
            access_token: alteredToken,
          },
        }),
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if jwt has expired', async () => {
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODZkMDIxZGY5NTEwNDI4ZDQyYmNkOTQiLCJpYXQiOjE3NTIwNTAwMzUsImV4cCI6MTc1MjA1MDA1MH0.PB9JnoM-Jwuu53Na2_iVOtFn6vpulnMTC0pACr_flUw';

    const context = createMockContext({ access_token: expiredToken });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
