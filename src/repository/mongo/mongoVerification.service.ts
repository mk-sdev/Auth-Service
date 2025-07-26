import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '../user.schema';
import { IVerification } from '../interfaces/iVerification';

@Injectable()
export class MongoVerificationService implements IVerification {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}

  async setNewVerificationToken(
    email: string,
    password: string,
    token: string,
    expiresAt: number,
  ): Promise<void> {
    await this.userModel.updateOne(
      { email },
      {
        $set: {
          password,
          verificationToken: token,
          verificationTokenExpires: expiresAt,
        },
      },
    );
  }

  async markEmailChangePending(
    id: string,
    pendingEmail: string,
    emailChangeToken: string,
    emailChangeTokenExpires: number,
  ): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          pendingEmail,
          emailChangeToken,
          emailChangeTokenExpires,
        },
      },
    );
  }

  async findOneByVerificationToken(
    token: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({ verificationToken: token });
  }

  async findOneByEmailToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ emailChangeToken: token });
  }

  async findOneByPasswordResetToken(
    token: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({ passwordResetToken: token });
  }
}
