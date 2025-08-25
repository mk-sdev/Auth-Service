import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoPasswordService } from './mongo/mongoPassword.service';
import { MongoTokenService } from './mongo/mongoToken.service';
import { MongoUserCrudService } from './mongo/mongoUserCrud.service';
import { MongoVerificationService } from './mongo/mongoVerification.service';
import { PasswordRepoService } from './passwordRepo.service';
import { TokenRepoService } from './tokenRepo.service';
import { UserSchema } from './mongo/user.schema';
import { UserCrudRepoService } from './userCrudRepo.service';
import { VerificationRepoService } from './verificationRepo.service';
import { PgUserCrudService } from './pg/pgUserCrud.service';
import { PgPasswordService } from './pg/pgPassword.service';
import { PgTokenService } from './pg/pgToken.service';
import { PgVerificationService } from './pg/pgVerification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './pg/user.entity';
import { UserRole } from './pg/user-role.entity';
import { RefreshToken } from './pg/refresh-token.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    TypeOrmModule.forFeature([User, UserRole, RefreshToken]),
  ],
  providers: [
    MongoUserCrudService,
    MongoPasswordService,
    MongoTokenService,
    MongoVerificationService,
    //
    PgUserCrudService,
    PgPasswordService,
    PgTokenService,
    PgVerificationService,
    //
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
