import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CoreModule } from './core/core.module';
import { ProtectedModule } from './protected/protected.module';
import { RepositoryModule } from './repository/repository.module';
import { RedisModule } from './utils/redis.module';
import { TokensModule } from './utils/tokens.module';
import { OAuthModule } from './oauth/oauth.module';
import { AuditModule } from './utils/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // lets use process.env in the whole app
    }),
    MongooseModule.forRoot('mongodb://localhost:27017/imagehub'),
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
