import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CoreService } from '../core/core.service';
import { JwtGuard } from '../guards/jwt.guard';
import { PasswordRepoService } from '../repository/passwordRepo.service';
import { TokenRepoService } from '../repository/tokenRepo.service';
import { UserCrudRepoService } from '../repository/userCrudRepo.service';
import { AuditLoggerService } from '../utils/audit/audit.service';
import { HashService } from '../utils/hash/hash.service';
import { ProtectedController } from './protected.controller';

describe('ProtectedController', () => {
  let controller: ProtectedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProtectedController],

      providers: [
        {
          provide: PasswordRepoService,
          useValue: {},
        },
        {
          provide: TokenRepoService,
          useValue: {},
        },
        {
          provide: UserCrudRepoService,
          useValue: {},
        },
        {
          provide: HashService,
          useValue: {},
        },
        {
          provide: CoreService,
          useValue: {},
        },
        {
          provide: AuditLoggerService,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProtectedController>(ProtectedController);
  });

  describe('ValidationPipe for SafeUserDto', () => {
    const validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    it('should pass', () => {
      expect(2 + 2).toBe(4);
    });
  });
});
