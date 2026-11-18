import { Module } from '@nestjs/common';
import { HashModule } from 'src/utils/hash/hash.module';
import { RepositoryModule } from '../repository/repository.module';
import { AuditModule } from '../utils/audit/audit.module';
import { TokensModule } from '../utils/tokens.module';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { RequestTimingInterceptor } from '../utils/request-timing.interceptor';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [RepositoryModule, TokensModule, AuditModule, HashModule, MailModule],
  controllers: [CoreController, TokenController,],
  providers: [CoreService, TokenService, RequestTimingInterceptor],
  exports: [CoreService, TokenService],
})
export class CoreModule { }
