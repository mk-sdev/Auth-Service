import { Module } from '@nestjs/common';
import { HashModule } from 'src/utils/hash/hash.module';
import { RepositoryModule } from '../repository/repository.module';
import { AuditModule } from '../utils/audit/audit.module';
import { TokensModule } from '../utils/tokens.module';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { MailService } from './mail.service';
import { TwoFactorService } from './2fa.service';
import { TwoFactorController } from './2fa.controller';

@Module({
  imports: [RepositoryModule, TokensModule, AuditModule, HashModule],
  controllers: [CoreController, TokenController, TwoFactorController],
  providers: [CoreService, TokenService, MailService, TwoFactorService],
  exports: [CoreService],
})
export class CoreModule {}
