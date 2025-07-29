import { Module } from '@nestjs/common';
import { HashModule } from 'src/utils/hash/hash.module';
import { RepositoryModule } from '../repository/repository.module';
import { AuditModule } from '../utils/audit/audit.module';
import { TokensModule } from '../utils/tokens.module';
import { ProtectedController } from './protected.controller';
import { CoreModule } from 'src/core/core.module';

@Module({
  imports: [
    RepositoryModule,
    TokensModule,
    AuditModule,
    HashModule,
    CoreModule,
  ],
  controllers: [ProtectedController],
})
export class ProtectedModule {}
