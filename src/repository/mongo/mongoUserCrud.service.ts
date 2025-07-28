import { Injectable } from '@nestjs/common';
import { IUserCrud } from '../interfaces/iUserCrud';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from './user.schema';
import { SafeUserDto } from 'src/dtos/safeUser.dto';

@Injectable()
export class MongoUserCrudService implements IUserCrud {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}

  async findOne(id: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ _id: id });
  }

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async getAllUsers() {
    return await this.userModel.find({}, 'email').lean();
  }

  async insertOne({
    email,
    password,
    verificationToken,
    verificationTokenExpires,
  }: {
    email: string;
    password: string;
    verificationToken: string;
    verificationTokenExpires: number;
  }): Promise<UserDocument> {
    return await this.userModel.create({
      email,
      password,
      verificationToken,
      verificationTokenExpires,
    });
  }

  async insertOne_OAuth(
    email: string,
    provider: string,
  ): Promise<UserDocument> {
    return await this.userModel.create({
      email,
      provider,
      isVerified: true,
    });
  }

  async moderateUser(
    _id: string,
    { email, roles, isVerified }: Omit<SafeUserDto, '_id'>,
  ) {
    await this.userModel.updateOne(
      { _id },
      {
        $set: {
          email,
          roles,
          isVerified,
        },
      },
    );
  }

  async verifyAccount(id: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          isVerified: true,
        },
        $unset: {
          verificationToken: '',
          verificationTokenExpires: '',
        },
      },
    );
  }

  async confirmEmailChange(userId: string, newEmail: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          email: newEmail,
        },
        $unset: {
          pendingEmail: '',
          emailChangeToken: '',
          emailChangeTokenExpires: '',
        },
      },
    );
  }

  async cancelScheduledDeletion(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $unset: {
          isDeletionPending: '',
          deletionScheduledAt: '',
        },
      },
    );
  }

  async markUserForDeletion(
    email: string,
    deletionScheduledAt: number,
  ): Promise<void> {
    await this.userModel.updateOne(
      { email },
      {
        $set: {
          isDeletionPending: true,
          deletionScheduledAt,
        },
      },
    );
  }
}
