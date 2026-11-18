import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IToken } from './interfaces/iToken';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class TokenRepoService implements IToken {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async findRefreshToken(
    userId: string,
    tokenId: string,
  ): Promise<string | null> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { userId, tokenId },
      select: ['token'],
    });
    return refreshToken?.token ?? null;
  }

  async addRefreshToken(
    userId: string,
    tokenId: string,
    token: string,
    tokenExpires: Date,
  ): Promise<void> {
    const refreshToken = this.refreshTokenRepository.create({
      token,
      tokenId,
      userId,
      tokenExpires,
    });
    await this.refreshTokenRepository.save(refreshToken);
  }

  async replaceRefreshToken(
    userId: string,
    oldTokenId: string,
    tokenId: string,
    newToken: string,
    tokenExpires: Date,
  ): Promise<boolean> {
    const result = await this.refreshTokenRepository.update(
      { userId, tokenId: oldTokenId },
      {
        token: newToken,
        tokenId,
        tokenExpires,
      },
    );
    return (result.affected ?? 0) > 0;
  }

  async removeRefreshToken(userId: string, tokenId: string): Promise<void> {
    await this.refreshTokenRepository.delete({
      userId,
      tokenId,
    });
  }

  async trimRefreshTokens(userId: string, maxTokens: number = 5): Promise<void> {
    const tokenCount = await this.refreshTokenRepository.countBy({ userId });
    const tokensToRemoveCount = tokenCount - maxTokens;
    if (tokensToRemoveCount <= 0) return;

    const tokens = await this.refreshTokenRepository.find({
      where: { userId },
      select: ['tokenId'],
      order: { tokenExpires: 'ASC', tokenId: 'ASC' },
      take: tokensToRemoveCount,
    });
    await this.refreshTokenRepository.delete(tokens.map(({ tokenId }) => tokenId));
  }

  async clearTokens(_id: string): Promise<void> {
    await this.refreshTokenRepository.delete({ userId: _id });
  }
}
