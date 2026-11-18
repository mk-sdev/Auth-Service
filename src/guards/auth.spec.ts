import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { JwtGuard } from './jwt.guard';
import { AuditLoggerService } from '../utils/audit/audit.service';

const createMockContext = (
  headers: Record<string, string> = {},
  cookies: Record<string, string> = {},
): ExecutionContext => {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers,
        cookies,
      }),
    }),
  } as unknown as ExecutionContext;
};

describe('JwtGuard - missing token', () => {
  let guard: JwtGuard;

  const mockAuditLogger = {
    unauthorized: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: 'JWT_ACCESS_SERVICE',
          useFactory: () => new JwtService({ secret: 'testingsecret' }),
        },
        {
          provide: AuditLoggerService,
          useValue: mockAuditLogger,
        },
        JwtGuard,
      ],
    }).compile();

    guard = module.get<JwtGuard>(JwtGuard);
  });

  it('should throw if no access token cookie is provided', async () => {
    const context = createMockContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw if only cookies are provided without access_token', async () => {
    const context = createMockContext({}, { session: 'abc' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should ignore a bearer token in the authorization header', async () => {
    const context = createMockContext(
      { authorization: 'Bearer valid-looking-token' },
      {},
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

});
