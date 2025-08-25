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

    const refreshToken = this.refreshTokenRepository.create({ token, user });
    await this.refreshTokenRepository.save(refreshToken);
  }

  async replaceRefreshToken(
    _id: string,
    oldToken: string,
    newToken: string,
  ): Promise<void> {
    const old = await this.refreshTokenRepository.findOne({
      where: { token: oldToken, user: { _id } },
      relations: ['user'],
    });

    if (old) {
      // aktualizacja tokenu
      await this.refreshTokenRepository.remove(old);
    }

    // dodanie nowego tokenu
    const user = await this.userRepository.findOne({ where: { _id } });
    if (!user) return;

    const newRefreshToken = this.refreshTokenRepository.create({
      token: newToken,
      user,
    });
    await this.refreshTokenRepository.save(newRefreshToken);
  }

  async removeRefreshToken(userId: string, token: string): Promise<void> {
    await this.refreshTokenRepository.delete({ token, user: { _id: userId } });
  }

  async trimRefreshTokens(userId: string, maxTokens: number): Promise<void> {
    const tokens = await this.refreshTokenRepository.find({
      where: { user: { _id: userId } },
      order: { token: 'DESC' }, // zakładamy, że tokeny najnowsze mają większe wartości (jeśli nie, dodaj createdAt)
    });

    if (tokens.length <= maxTokens) return;

    const tokensToRemove = tokens.slice(0, tokens.length - maxTokens);
    await this.refreshTokenRepository.remove(tokensToRemove);
  }

  async clearTokens(_id: string): Promise<void> {
    await this.refreshTokenRepository.delete({ user: { _id } });
  }
}
