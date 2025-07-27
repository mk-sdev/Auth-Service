import { Module } from '@nestjs/common';
import { CoreModule } from 'src/core/core.module';
import { RepositoryModule } from '../repository/repository.module';
import { TokensModule } from '../utils/tokens.module';
import { ProtectedController } from './protected.controller';

@Module({
  imports: [CoreModule, RepositoryModule, TokensModule],
  controllers: [ProtectedController],
  // providers: [HashService],
})
export class ProtectedModule {}
