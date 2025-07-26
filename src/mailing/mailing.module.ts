import { Module } from '@nestjs/common';
import { MailingController } from './mailing.controller';
import { MailingService } from './mailing.service';
import { RepositoryModule } from '../repository/repository.module';
import { TokensModule } from '../utils/tokens.module';
import { HashService } from '../utils/hash.service';

@Module({
  imports: [RepositoryModule, TokensModule],
  controllers: [MailingController],
  providers: [MailingService, HashService],
  exports: [MailingService],
})
export class MailingModule {}
