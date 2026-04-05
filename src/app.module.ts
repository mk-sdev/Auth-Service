import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from './core/core.module';
import { OAuthModule } from './oauth/oauth.module';
import { ProtectedModule } from './protected/protected.module';
import { RefreshToken } from './repository/entities/refresh-token.entity';
import { UserRole } from './repository/entities/user-role.entity';
import { User } from './repository/entities/user.entity';
import { RepositoryModule } from './repository/repository.module';
import { AuditModule } from './utils/audit/audit.module';
import { HashModule } from './utils/hash/hash.module';
import { RedisModule } from './utils/redis.module';
import { TokensModule } from './utils/tokens.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // lets use process.env in the whole app
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: +process.env.DB_PORT! || 5432,
      username: process.env.DB_USER || 'auth_user',
      password: process.env.DB_PASSWORD || 'auth_password',
      database:
        process.env.NODE_ENV === 'test'
          ? 'test_db'
          : process.env.DB_NAME || 'auth_db',
      entities: [User, UserRole, RefreshToken],
      synchronize: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10000,
          limit: 20,
        },
      ],
    }),
    MailerModule.forRoot({
      transport: {
        host: 'sandbox.smtp.mailtrap.io',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: '"Twoja Apka" <no-reply@twoja-apka.pl>',
      },
    }),
    RepositoryModule,
    TokensModule,
    CoreModule,
    JwtModule,
    ProtectedModule,
    RedisModule,
    OAuthModule,
    AuditModule,
    HashModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
