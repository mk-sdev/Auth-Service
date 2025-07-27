// oauth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { OAuthController } from './oauth.controller';
import { GoogleStrategy } from './google.strategy.service';
import { OAuthService } from './oauth.service';

@Module({
  imports: [PassportModule.register({ session: false })],
  providers: [GoogleStrategy, OAuthService],
  controllers: [OAuthController],
})
export class OAuthModule {}
