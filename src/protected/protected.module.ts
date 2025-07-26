import { Module } from '@nestjs/common';
import { ProtectedController } from './protected.controller';
import { ProtectedService } from './protected.service';
import { RepositoryModule } from '../repository/repository.module';
import { TokensModule } from '../utils/tokens.module';
import { HashService } from '../hash.service';

@Module({
  imports: [RepositoryModule, TokensModule],
  controllers: [ProtectedController],
  providers: [ProtectedService, HashService],
})
export class ProtectedModule {}
