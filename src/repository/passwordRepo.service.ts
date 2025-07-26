import { Injectable } from '@nestjs/common';
import { IPassword } from './interfaces/iPassword';
import { MongoPasswordService } from './mongo/mongoPassword.service';

@Injectable()
export class PasswordRepoService implements IPassword {
  private repoService: IPassword;

  constructor(
    private readonly mongoService: MongoPasswordService,
    // private readonly pgService: PgService,
  ) {
    this.repoService = this.mongoService;
    // if (process.env.DB_TYPE === 'mongo') {
    //   this.repoService = this.mongoService;
    // } else {
    //   this.repoService = this.pgService;
    // }
  }

  async changePassword(_id: string, password: string) {
    await this.repoService.changePassword(_id, password);
  }

  async updatePasswordAndClearTokens(
    email: string,
    hashedPassword: string,
  ): Promise<void> {
    await this.repoService.updatePasswordAndClearTokens(email, hashedPassword);
  }

  async setNewPasswordFromResetToken(
    token: string,
    newPassword: string,
  ): Promise<void> {
    await this.repoService.setNewPasswordFromResetToken(token, newPassword);
  }

  async remindPassword(
    email: string,
    resetToken: string,
    passwordResetTokenExpires: number,
  ): Promise<void> {
    await this.repoService.remindPassword(
      email,
      resetToken,
      passwordResetTokenExpires,
    );
  }
}
