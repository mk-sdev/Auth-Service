import { Module } from '@nestjs/common';
import { MailingController } from './mailing.controller';
import { MailingService } from './mailing.service';
import { RepositoryModule } from '../repository/repository.module';
import { TokensModule } from '../utils/tokens.module';
import { HashService } from './hash.service';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';

@Module({
  imports: [RepositoryModule, TokensModule],
  controllers: [CoreController, MailingController],
  providers: [CoreService, MailingService, HashService],
  exports: [HashService, CoreService],
})
export class CoreModule {}
