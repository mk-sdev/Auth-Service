// oauth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { OAuthController } from './oauth.controller';
import { GoogleStrategy } from './google.strategy.service';
import { OAuthService } from './oauth.service';
import { RepositoryModule } from '../repository/repository.module';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    RepositoryModule,
    CoreModule,
  ],
  providers: [GoogleStrategy, OAuthService],
  controllers: [OAuthController],
})
export class OAuthModule {}
