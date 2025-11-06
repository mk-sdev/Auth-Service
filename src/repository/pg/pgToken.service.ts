import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IToken } from '../interfaces/iToken';
import { RefreshToken } from './refresh-token.entity';
import { User } from './user.entity';

@Injectable()
export class PgTokenService implements IToken {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async addRefreshToken(_id: string, token: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { _id } });
    if (!user) return;

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId: user._id,
    });
    await this.refreshTokenRepository.save(refreshToken);
  }

  async replaceRefreshToken(
    _id: string,
    oldToken: string,
    newToken: string,
  ): Promise<void> {
    const old = await this.refreshTokenRepository.findOne({
      where: { token: oldToken, userId: _id },
      relations: ['user'],
    });

    if (old) {
      // token update
      await this.refreshTokenRepository.remove(old);
    }

    // add new token
    const user = await this.userRepository.findOne({ where: { _id } });
    if (!user) return;

    const newRefreshToken = this.refreshTokenRepository.create({
      token: newToken,
      userId: user._id,
    });
    await this.refreshTokenRepository.save(newRefreshToken);
  }

  async removeRefreshToken(userId: string, token: string): Promise<void> {
    await this.refreshTokenRepository.delete({
      token,
      userId: userId,
    });
  }

  async trimRefreshTokens(userId: string, maxTokens: number): Promise<void> {
    const tokens = await this.refreshTokenRepository.find({
      where: { userId },
      order: { token: 'DESC' },
    });

    if (tokens.length <= maxTokens) return;

    const tokensToRemove = tokens.slice(0, tokens.length - maxTokens);
    await this.refreshTokenRepository.remove(tokensToRemove);
  }

  async clearTokens(_id: string): Promise<void> {
    await this.refreshTokenRepository.delete({ userId: _id });
  }
}
