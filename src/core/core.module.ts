import { Module } from '@nestjs/common';
import { RepositoryModule } from '../repository/repository.module';
import { AuditModule } from '../utils/audit/audit.module';
import { TokensModule } from '../utils/tokens.module';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';
import { HashService } from './hash.service';
import { MailingController } from './mailing.controller';
import { MailingService } from './mailing.service';

@Module({
  imports: [RepositoryModule, TokensModule, AuditModule],
  controllers: [CoreController, MailingController],
  providers: [CoreService, MailingService, HashService],
  exports: [HashService, CoreService],
})
export class CoreModule {}
