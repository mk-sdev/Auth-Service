import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoPasswordService } from './mongo/mongoPassword.service';
import { MongoTokenService } from './mongo/mongoToken.service';
import { MongoUserCrudService } from './mongo/mongoUserCrud.service';
import { MongoVerificationService } from './mongo/mongoVerification.service';
import { PasswordRepoService } from './passwordRepo.service';
import { TokenRepoService } from './tokenRepo.service';
import { UserSchema } from './user.schema';
import { UserCrudRepoService } from './userCrudRepo.service';
import { VerificationRepoService } from './verificationRepo.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  providers: [
    MongoUserCrudService,
    MongoPasswordService,
    MongoTokenService,
    MongoVerificationService,
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
export class RepositoryModule {}
