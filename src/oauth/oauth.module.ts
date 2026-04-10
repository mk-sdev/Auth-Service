// oauth.module.ts
import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { RepositoryModule } from '../repository/repository.module';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';

@Module({
  imports: [
    // PassportModule.register({ session: false }),
    RepositoryModule,
    CoreModule,
  ],
  providers: [ OAuthService],
  controllers: [OAuthController],
})
export class OAuthModule {}
