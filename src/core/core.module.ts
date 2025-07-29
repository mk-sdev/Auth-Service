import { Module } from '@nestjs/common';
import { HashModule } from 'src/utils/hash/hash.module';
import { RepositoryModule } from '../repository/repository.module';
import { AuditModule } from '../utils/audit/audit.module';
import { TokensModule } from '../utils/tokens.module';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';
import { MailingController } from './mailing.controller';
import { MailingService } from './mailing.service';

@Module({
  imports: [RepositoryModule, TokensModule, AuditModule, HashModule],
  controllers: [CoreController, MailingController],
  providers: [CoreService, MailingService],
  exports: [CoreService],
})
export class CoreModule {}
