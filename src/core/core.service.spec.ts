import { Test, TestingModule } from '@nestjs/testing';
import { CoreService } from './core.service';
import { PasswordRepoService } from '../repository/passwordRepo.service';
import { TokenRepoService } from '../repository/tokenRepo.service';
import { UserCrudRepoService } from '../repository/userCrudRepo.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, Role } from '../utils/interfaces';
import { HashService } from '../utils/hash/hash.service';
import { Request } from 'express';
import { AuditModule } from '../utils/audit/audit.module';
import { MailService } from './mail.service'; // Import MailService here

describe('CoreService', () => {
  let appService: CoreService;

  const mockRequest = {
    headers: { 'x-forwarded-for': '127.0.0.1' },
    ip: '127.0.0.1',
    method: 'GET',
    originalUrl: '/example',
  } as unknown as Request;

  const mockUserRepo = {
    findOne: jest.fn(),
    removeRefreshToken: jest.fn(),
    updatePasswordAndClearTokens: jest.fn(),
    markUserForDeletion: jest.fn(),
    findOneByEmail: jest.fn(),
  };

  const mockJwtAccessService = {};

  const mockJwtRefreshService = {
    clearRefreshTokens: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockMailService = {
    sendPasswordChangedEmail: jest.fn(),
    sendSuspiciousLoginEmail: jest.fn(),
    sendAccountDeletionAlert: jest.fn(),
  };

  const hashService = {
    verify: jest.fn(),
    hash: jest.fn(),
  };

  const mockRedisClient = {
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuditModule],
      providers: [
        CoreService,
        {
          provide: PasswordRepoService,
          useValue: mockUserRepo,
        },
        {
          provide: TokenRepoService,
          useValue: mockUserRepo,
        },
        {
          provide: UserCrudRepoService,
          useValue: mockUserRepo,
        },
        {
          provide: 'JWT_ACCESS_SERVICE',
          useValue: mockJwtAccessService,
        },
        {
          provide: 'JWT_REFRESH_SERVICE',
          useValue: mockJwtRefreshService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
        {
          provide: HashService,
          useValue: hashService,
        },
      ],
    }).compile();

    appService = module.get<CoreService>(CoreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should rate limit logins and send email on too many attempts', async () => {
      // mock Redis to simulate 6 failed login attempts
      mockRedisClient.incr = jest.fn().mockResolvedValueOnce(6);
      mockRedisClient.expire = jest.fn().mockResolvedValue(undefined);

      const email = 'test@example.com';

      // simulate a login attempt
      mockUserRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(appService.login(email, mockRequest)).rejects.toThrow(
        'Too many login attempts. Try again later.',
      );

      // check if suspicious login email was sent
      expect(mockMailService.sendSuspiciousLoginEmail).toHaveBeenCalledWith(
        email,
        '127.0.0.1',
      );
      // ensure Redis keys are managed
      expect(mockRedisClient.incr).toHaveBeenCalledWith(
        `login_attempts:${email}`,
      );
    });
  });

  describe('changePassword', () => {
    it('should throw if new password is same as current', async () => {
      await expect(
        appService.changePassword(
          'userId',
          'samepassword',
          'samepassword',
          mockRequest,
        ),
      ).rejects.toThrow('New password cannot be the same as the old one');
    });

    it('should change password and clear refresh tokens', async () => {
      const userMock = {
        _id: 'userId',
        email: 'test@example.com',
        password: 'hashedPassword',
        refreshtokens: ['token1', 'token2'],
      };

      mockUserRepo.findOne.mockResolvedValue(userMock);
      jest.spyOn(hashService, 'verify').mockResolvedValue(true);
      jest.spyOn(hashService, 'hash').mockResolvedValue('newHashedPassword');
      mockUserRepo.updatePasswordAndClearTokens = jest
        .fn()
        .mockResolvedValue(undefined);

      await appService.changePassword(
        'userId',
        'oldPassword',
        'newPassword',
        mockRequest,
      );

      expect(mockUserRepo.updatePasswordAndClearTokens).toHaveBeenCalledWith(
        userMock.email,
        'newHashedPassword',
      );
    });
  });

  describe('markForDeletion', () => {
    it('should mark user for deletion and send email', async () => {
      const userMock = {
        _id: 'userId',
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      mockUserRepo.findOne.mockResolvedValue(userMock);
      jest.spyOn(hashService, 'verify').mockResolvedValue(true);
      mockUserRepo.markUserForDeletion = jest.fn().mockResolvedValue(undefined);

      await appService.markForDeletion(
        'userId',
        'correctPassword',
        mockRequest,
      );

      expect(mockUserRepo.markUserForDeletion).toHaveBeenCalled();
      expect(mockMailService.sendAccountDeletionAlert).toHaveBeenCalledWith(
        userMock.email,
      );
    });
  });
});
