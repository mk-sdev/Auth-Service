import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { JwtGuard } from './jwt.guard';

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

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: 'JWT_ACCESS_SERVICE',
          useFactory: () => new JwtService({ secret: 'testingsecret' }),
        },
        JwtGuard,
      ],
    }).compile();

    guard = module.get<JwtGuard>(JwtGuard);
  });

  it('should throw if neither header nor cookie provided', async () => {
    const context = createMockContext(); // brak headers i cookies

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

  it('should throw if only headers are provided without Authorization', async () => {
    const context = createMockContext({ 'x-custom-header': 'xyz' }, {});

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
