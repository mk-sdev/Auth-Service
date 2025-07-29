import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { RepositoryModule } from '../repository/repository.module';
import { TokensModule } from '../utils/tokens.module';
import { ProtectedController } from './protected.controller';
import { AuditModule } from '../utils/audit/audit.module';

@Module({
  imports: [CoreModule, RepositoryModule, TokensModule, AuditModule],
  controllers: [ProtectedController],
  // providers: [HashService],
})
export class ProtectedModule {}
