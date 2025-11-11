import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreService } from './core.service';
import { HashService } from '../utils/hash/hash.service';
import { User } from '../repository/pg/user.entity';
import { UserRole } from '../repository/pg/user-role.entity';
import { RefreshToken } from '../repository/pg/refresh-token.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider, Role } from '../utils/interfaces';
import { AuditLoggerService } from '../utils/audit/audit.service';
import { MailService } from './mail.service';
import { PasswordRepoService } from '../repository/passwordRepo.service';
import { TokenRepoService } from '../repository/tokenRepo.service';
import { UserCrudRepoService } from '../repository/userCrudRepo.service';
import { MongoUserCrudService } from '../repository/mongo/mongoUserCrud.service';
import { PgUserCrudService } from '../repository/pg/pgUserCrud.service';
import { PgTokenService } from '../repository/pg/pgToken.service';
import { MongoTokenService } from '../repository/mongo/mongoToken.service';
import { Request } from 'express';
import { TokensModule } from '../utils/tokens.module';
process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

describe('CoreService - Integration (real DB)', () => {
  let coreService: CoreService;
  let userRepo: Repository<User>;
  let roleRepo: Repository<UserRole>;
  let refreshTokenRepo: Repository<RefreshToken>;
  let hashService: HashService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: +process.env.DB_PORT! || 5433,
          username: process.env.DB_USER || 'auth_user',
          password: process.env.DB_PASSWORD || 'auth_password',
          database: 'test_db',
          entities: [User, UserRole, RefreshToken],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User, UserRole, RefreshToken]),
        JwtModule.register({
          secret: 'test',
          signOptions: { expiresIn: '1h' },
        }),
        TokensModule,
      ],
      providers: [
        CoreService,
        HashService,
        UserCrudRepoService,
        TokenRepoService,
        PgUserCrudService,
        MongoUserCrudService,
        PgTokenService,
        MongoTokenService,
        {
          provide: 'PROM_METRIC_HASHING_DURATION_SECONDS',
          useValue: {
            startTimer: jest.fn(() => () => {}),
          },
        },
        {
          provide: PasswordRepoService,
          useValue: {},
        },
        {
          provide: 'UserModel',
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: { incr: jest.fn(), expire: jest.fn(), del: jest.fn() },
        },
        {
          provide: AuditLoggerService,
          useValue: { warn: jest.fn() },
        },
        {
          provide: MailService,
          useValue: { sendSuspiciousLoginEmail: jest.fn() },
        },
      ],
    }).compile();

    coreService = module.get(CoreService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepo = module.get<Repository<UserRole>>(getRepositoryToken(UserRole));
    refreshTokenRepo = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );
    hashService = module.get(HashService);
    //const refreshTokenService = module.get<JwtService>('JWT_REFRESH_SERVICE');
  });

  beforeEach(async () => {
    await refreshTokenRepo.createQueryBuilder().delete().execute();
    await roleRepo.createQueryBuilder().delete().execute();
    await userRepo.createQueryBuilder().delete().execute();
  });

  beforeEach(async () => {
    const passwordHash = await hashService.hash('zaq1@WSX');
    const user = userRepo.create({
      email: 'user1@example.com',
      password: passwordHash,
      isVerified: true,
      provider: Provider.LOCAL,
    });

    const savedUser = await userRepo.save(user);

    const role = roleRepo.create({ userId: savedUser._id, role: Role.USER });
    await roleRepo.save(role);
  });

  it('should add a refresh token for a user', async () => {
    const user = await userRepo.findOne({
      where: { email: 'user1@example.com' },
    });

    const mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      path: '/login',
      method: 'POST',
    } as unknown as Request;

    await coreService.login(user!.email, mockRequest, 'zaq1@WSX');

    const tokens = await refreshTokenRepo.find({
      where: { userId: user!._id },
    });

    expect(tokens.length).toBe(1);
    expect(tokens[0].token.startsWith('$argon2id$')).toBe(true);
  });

  it('should replace the oldest token if user has 5 tokens', async () => {
    const user = await userRepo.findOne({
      where: { email: 'user1@example.com' },
    });

    // add 5 mock tokens
    for (let i = 1; i <= 5; i++) {
      const token = refreshTokenRepo.create({
        userId: user!._id,
        token: `old_token_${i}`,
      });
      await refreshTokenRepo.save(token);
    }

    const mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      path: '/login',
      method: 'POST',
    } as unknown as Request;

    await coreService.login(user!.email, mockRequest, 'zaq1@WSX');

    const tokens = await refreshTokenRepo.find({
      where: { userId: user!._id },
      order: { token: 'ASC' },
    });

    // still 5 tokens
    expect(tokens.length).toBe(5);

    // the oldest one should be deleted
    expect(tokens.map((t) => t.token)).not.toContain('old_token_1');

    // updated tokens should include a new hashed token
    const hasArgon2 = tokens.some((t) => t.token.startsWith('$argon2id$'));
    expect(hasArgon2).toBe(true);
  });

  it('should remove the specific refresh token on logout', async () => {
    // find the test user
    const user = await userRepo.findOne({
      where: { email: 'user1@example.com' },
    });

    // generate a real JWT refresh tokens
    const refreshTokenService = module.get<JwtService>('JWT_REFRESH_SERVICE');
    const refreshTokenPlain1 = await refreshTokenService.signAsync({
      sub: user!._id,
      iat: Date.now(),
    });
    const refreshTokenPlain2 = await refreshTokenService.signAsync({
      sub: user!._id,
      iat: Date.now() + 1,
    });

    // hash the tokens
    const hashedToken1 = await hashService.hash(refreshTokenPlain1);
    const hashedToken2 = await hashService.hash(refreshTokenPlain2);

    // save them in the db
    await refreshTokenRepo.save(
      refreshTokenRepo.create({
        userId: user!._id,
        token: hashedToken1,
      }),
    );
    await refreshTokenRepo.save(
      refreshTokenRepo.create({
        userId: user!._id,
        token: hashedToken2,
      }),
    );

    // check if they exist in  the db
    let tokensInDb = await refreshTokenRepo.find({
      where: { userId: user!._id },
    });
    expect(tokensInDb.length).toBe(2);

    // perform logout
    await coreService.logout(refreshTokenPlain1);

    // check if the token has been removed
    tokensInDb = await refreshTokenRepo.find({ where: { userId: user!._id } });

    const remaining = await hashService.verify(
      tokensInDb[0].token,
      refreshTokenPlain2,
    );
    expect(remaining).toBe(true);
    expect(tokensInDb.length).toBe(1);
  });

  it('should remove all refresh tokens on global logout', async () => {
    // find the test user
    const user = await userRepo.findOne({
      where: { email: 'user1@example.com' },
    });

    // generate a real JWT refresh tokens
    const refreshTokenService = module.get<JwtService>('JWT_REFRESH_SERVICE');
    const refreshTokenPlain1 = await refreshTokenService.signAsync({
      sub: user!._id,
      iat: Date.now(),
    });
    const refreshTokenPlain2 = await refreshTokenService.signAsync({
      sub: user!._id,
      iat: Date.now() + 1,
    });

    // hash the tokens
    const hashedToken1 = await hashService.hash(refreshTokenPlain1);
    const hashedToken2 = await hashService.hash(refreshTokenPlain2);

    // save them in the db
    await refreshTokenRepo.save(
      refreshTokenRepo.create({
        userId: user!._id,
        token: hashedToken1,
      }),
    );
    await refreshTokenRepo.save(
      refreshTokenRepo.create({
        userId: user!._id,
        token: hashedToken2,
      }),
    );

    // check if they exist in  the db
    let tokensInDb = await refreshTokenRepo.find({
      where: { userId: user!._id },
    });
    expect(tokensInDb.length).toBe(2);

    // perform global logout
    await coreService.globalLogout(user!._id);

    // check if the token has been removed
    tokensInDb = await refreshTokenRepo.find({ where: { userId: user!._id } });

    expect(tokensInDb.length).toBe(0);
  });

  it('should exchange refresh tokens on refresh', async () => {
    // find the test user
    const user = await userRepo.findOne({
      where: { email: 'user1@example.com' },
    });

    // generate a real JWT refresh tokens
    const refreshTokenService = module.get<JwtService>('JWT_REFRESH_SERVICE');
    const refreshTokenPlain1 = await refreshTokenService.signAsync({
      sub: user!._id,
      iat: Date.now(),
    });
    const refreshTokenPlain2 = await refreshTokenService.signAsync({
      sub: user!._id,
      iat: Date.now() + 1,
    });

    // hash the tokens
    const hashedToken1 = await hashService.hash(refreshTokenPlain1);
    const hashedToken2 = await hashService.hash(refreshTokenPlain2);

    // save them in the db
    await refreshTokenRepo.save(
      refreshTokenRepo.create({
        userId: user!._id,
        token: hashedToken1,
      }),
    );
    await refreshTokenRepo.save(
      refreshTokenRepo.create({
        userId: user!._id,
        token: hashedToken2,
      }),
    );

    // check if they exist in  the db
    let tokensInDb = await refreshTokenRepo.find({
      where: { userId: user!._id },
    });
    expect(tokensInDb.length).toBe(2);

    // perform global logout
    await coreService.refreshTokens(refreshTokenPlain2);

    // check if the token has been removed
    tokensInDb = await refreshTokenRepo.find({
      where: { userId: user!._id },
    });
    expect(tokensInDb.length).toBe(2);

    // should replace the used token with a new one
    const newToken = await hashService.verify(
      tokensInDb[1].token,
      refreshTokenPlain2,
    );
    expect(newToken).not.toBe(true);

    // other tokens should stay in the db
    const untouchedToken = await hashService.verify(
      tokensInDb[0].token,
      refreshTokenPlain1,
    );
    expect(untouchedToken).toBe(true);
  });
});
