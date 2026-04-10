// oauth.module.ts
import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { RepositoryModule } from '../repository/repository.module';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { RedisModule } from '../utils/redis.module';
import { TokensModule } from '../utils/tokens.module';
import { AuditModule } from '../utils/audit/audit.module';

@Module({
  imports: [
    RepositoryModule,
    CoreModule,
    RedisModule,
    TokensModule,
    AuditModule
  ],
  providers: [ OAuthService],
  controllers: [OAuthController],
})
export class OAuthModule {}
