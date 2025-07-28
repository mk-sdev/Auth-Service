import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from './user.schema';
import { IPassword } from '../interfaces/iPassword';
import { Provider } from '../../utils/interfaces';

@Injectable()
export class MongoPasswordService implements IPassword {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}

  async changePassword(_id: string, password: string) {
    await this.userModel.updateOne({ _id }, { $set: { password } });
  }

  async updatePasswordAndClearTokens(
    email: string,
    hashedPassword: string,
  ): Promise<void> {
    await this.userModel.updateOne(
      { email },
      {
        $set: {
          password: hashedPassword,
          refreshTokens: [],
          provider: Provider.LOCAL,
        },
      },
    );
  }
  async setNewPasswordFromResetToken(
    token: string,
    newPassword: string,
  ): Promise<void> {
    await this.userModel.updateOne(
      { passwordResetToken: token },
      {
        $set: {
          password: newPassword,
          refreshTokens: [],
        },
        $unset: {
          passwordResetToken: '',
          passwordResetTokenExpires: '',
        },
      },
    );
  }
  async remindPassword(
    email: string,
    resetToken: string,
    passwordResetTokenExpires: number,
  ): Promise<void> {
    await this.userModel.updateOne(
      { email },
      {
        $set: {
          passwordResetToken: resetToken,
          passwordResetTokenExpires,
        },
      },
    );
  }
}
