import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserRole } from './entities/user-role.entity';
import { User } from './entities/user.entity';
import { PasswordRepoService } from './passwordRepo.service';
import { TokenRepoService } from './tokenRepo.service';
import { UserCrudRepoService } from './userCrudRepo.service';
import { VerificationRepoService } from './verificationRepo.service';
import { BackupCode } from './entities/backup-code.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRole, RefreshToken, BackupCode]),
  ],
  providers: [
    UserCrudRepoService,
    PasswordRepoService,
    TokenRepoService,
    VerificationRepoService,
  ],
  exports: [
    UserCrudRepoService,
    PasswordRepoService,
    TokenRepoService,
    VerificationRepoService,
  ],
})
export class RepositoryModule { }
