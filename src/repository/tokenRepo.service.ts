import { Injectable } from '@nestjs/common';
import { IToken } from './interfaces/iToken';
import { MongoTokenService } from './mongo/mongoToken.service';
// import { PgTokenService } from './pg/pgToken.service';

@Injectable()
export class TokenRepoService implements IToken {
  private repoService: IToken;

  constructor(
    private readonly mongoService: MongoTokenService,
    // private readonly pgService: PgTokenService,
  ) {
    if (process.env.DB_TYPE === 'mongo') {
      this.repoService = this.mongoService;
    }
    // else this.repoService = this.pgService;
  }

  async addRefreshToken(id: string, token: string): Promise<void> {
    await this.repoService.addRefreshToken(id, token);
  }

  async replaceRefreshToken(
    id: string,
    oldToken: string,
    newToken: string,
  ): Promise<void> {
    await this.repoService.replaceRefreshToken(id, oldToken, newToken);
  }

  async removeRefreshToken(userId: string, token: string): Promise<void> {
    await this.repoService.removeRefreshToken(userId, token);
  }

  async trimRefreshTokens(userId: string): Promise<void> {
    await this.repoService.trimRefreshTokens(userId, 5);
  }

  async clearTokens(id: string) {
    await this.repoService.clearTokens(id);
  }
}
