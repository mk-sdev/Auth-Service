import { Injectable } from '@nestjs/common';
import { IVerification } from './interfaces/iVerification';
import { MongoVerificationService } from './mongo/mongoVerification.service';
import { UserDocument } from './mongo/user.schema';

@Injectable()
export class VerificationRepoService implements IVerification {
  private repoService: IVerification;

  constructor(
    private readonly mongoService: MongoVerificationService,
    // private readonly pgService: PgService,
  ) {
    this.repoService = this.mongoService;
    // if (process.env.DB_TYPE === 'mongo') {
    //   this.repoService = this.mongoService;
    // } else {
    //   this.repoService = this.pgService;
    // }
  }

  async setNewVerificationToken(
    email: string,
    password: string,
    token: string,
    expiresAt: number,
  ): Promise<void> {
    await this.repoService.setNewVerificationToken(
      email,
      password,
      token,
      expiresAt,
    );
  }

  async markEmailChangePending(
    id: string,
    pendingEmail: string,
    emailChangeToken: string,
    emailChangeTokenExpires: number,
  ): Promise<void> {
    await this.repoService.markEmailChangePending(
      id,
      pendingEmail,
      emailChangeToken,
      emailChangeTokenExpires,
    );
  }

  async findOneByVerificationToken(
    token: string,
  ): Promise<UserDocument | null> {
    return this.repoService.findOneByVerificationToken(token);
  }

  async findOneByEmailToken(token: string): Promise<UserDocument | null> {
    return this.repoService.findOneByEmailToken(token);
  }

  async findOneByPasswordResetToken(
    token: string,
  ): Promise<UserDocument | null> {
    return this.repoService.findOneByPasswordResetToken(token);
  }
}
