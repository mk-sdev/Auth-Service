import { Module } from '@nestjs/common';
import { HashModule } from 'src/utils/hash/hash.module';
import { RepositoryModule } from '../repository/repository.module';
import { AuditModule } from '../utils/audit/audit.module';
import { TokensModule } from '../utils/tokens.module';
import { ProtectedController } from './protected.controller';

@Module({
  imports: [RepositoryModule, TokensModule, AuditModule, HashModule],
  controllers: [ProtectedController],
})
export class ProtectedModule {}
