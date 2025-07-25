import { Module } from '@nestjs/common';
import { ProtectedController } from './protected.controller';
import { ProtectedService } from './protected.service';
import { RepositoryModule } from '../repository/repository.module';
import { TokensModule } from 'src/utils/tokens.module';

@Module({
  imports: [RepositoryModule, TokensModule],
  controllers: [ProtectedController],
  providers: [ProtectedService],
})
export class ProtectedModule {}
