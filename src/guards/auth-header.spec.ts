import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { JwtGuard } from './jwt.guard';
import { JwtPayload, Role } from '../utils/interfaces';
import { AuditLoggerService } from '../utils/audit/audit.service';

// helper type to mock the request from the header
interface MockRequest {
  headers: Record<string, string>;
  user?: JwtPayload;
}

// helper type to mock ExecutionContext
const createMockContext = (token: string): ExecutionContext => {
  return {
    switchToHttp: () => ({
      getRequest: () =>
        ({
          headers: {
            authorization: `Bearer ${token}`,
          },
        }) as MockRequest,
    }),
  } as unknown as ExecutionContext;
};

describe('JwtGuard', () => {
  let jwtService: JwtService;
  let guard: JwtGuard;

  const mockAuditLogger = {
    unauthorized: jest.fn(),
  };

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
        {
          provide: AuditLoggerService,
          useValue: mockAuditLogger,
        },
        JwtGuard,
      ],
    }).compile();
    jwtService = module.get<JwtService>('JWT_ACCESS_SERVICE');
    guard = module.get<JwtGuard>(JwtGuard);
  });

  it('should return true for valid token', async () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODg3MWY0NzI5YTgwMTM0MDkyMTM1NjUiLCJyb2xlcyI6WyJVU0VSIl0sImlhdCI6MTc1ODI3MDQ3OSwiZXhwIjozMzI4NDMxMjg3OX0.U8BaMs_oUCVzZ9mTORDX3xbXl237V9JLn5ktYx5drvU';

    const context = createMockContext(token);

    const expectedPayload: JwtPayload = {
      sub: '68871f4729a8013409213565',
      roles: [Role.USER],
      iat: 1758270479,
      exp: 33284312879, // 999 years
    };

    const payload: JwtPayload = await jwtService.verifyAsync(token);
    expect(payload).toEqual(expectedPayload);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException if secret is invalid', async () => {
    const invalidToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODZkMDIxZGY5NTEwNDI4ZDQyYmNkOTQiLCJpYXQiOjE3NTIwNDk0NTksImV4cCI6MzMyNzgwOTE4NTl9.iqAkno2HJW6J1-A3do50hs95diMRaDljyyzR0Ii2EU4'; // secret: wrongsecret

    const context = createMockContext(invalidToken);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if jwt has been altered', async () => {
    const alteredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODZkMDIxZGY5NTEwNDI4ZDQyYmNkOTQiLCJpYXQiOjE3NTIwNDk4MTMsImV4cCI6MzMyNzgwOsTIyMTN9.YJy0_zD-wIYXwNEfwDSVOjaCTwm7EhXC0B1dZ-FsWUI';

    const context = createMockContext(alteredToken);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if jwt has expired', async () => {
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODZkMDIxZGY5NTEwNDI4ZDQyYmNkOTQiLCJpYXQiOjE3NTIwNTAwMzUsImV4cCI6MTc1MjA1MDA1MH0.PB9JnoM-Jwuu53Na2_iVOtFn6vpulnMTC0pACr_flUw';

    const context = createMockContext(expiredToken);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // it('should throw UnauthorizedException if no token provided', async () => {
  //   const context = {
  //     switchToHttp: () => ({
  //       getRequest: () => ({
  //         headers: {
  //           authorization: `Bearer `,
  //         },
  //       }),
  //     }),
  //   } as ExecutionContext;

  //   await expect(guard.canActivate(context)).rejects.toThrow(
  //     UnauthorizedException,
  //   );
  // });
});
