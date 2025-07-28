import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IToken } from '../interfaces/iToken';
import { UserDocument } from './user.schema';

@Injectable()
export class MongoTokenService implements IToken {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}

  async addRefreshToken(id: string, token: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      { $push: { refreshTokens: token } },
    );
  }

  async replaceRefreshToken(
    id: string,
    oldToken: string,
    newToken: string,
  ): Promise<void> {
    const result = await this.userModel.updateOne(
      { _id: id, refreshTokens: oldToken },
      { $set: { 'refreshTokens.$': newToken } },
    );

    // if old token hasn't been found, just add a new one
    if (result.matchedCount === 0) {
      await this.userModel.updateOne(
        { _id: id },
        { $push: { refreshTokens: newToken } },
      );
    }
  }

  async removeRefreshToken(userId: string, token: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { refreshTokens: token } },
    );
  }

  async trimRefreshTokens(userId: string, maxTokens: number): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $push: {
          refreshTokens: {
            $each: [],
            $slice: -maxTokens, // leaves 5 last (most recent) tokens
          },
        },
      },
    );
  }

  async clearTokens(id: string) {
    await this.userModel.updateOne(
      { _id: id },
      { $set: { refreshTokens: [] } },
    );
  }
}
