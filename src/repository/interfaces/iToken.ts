export interface IToken {
  findRefreshToken(userId: string, tokenId: string): Promise<string | null>;
  addRefreshToken(
    userId: string,
    tokenId: string,
    token: string,
    tokenExpires: Date,
  ): Promise<void>;
  replaceRefreshToken(
    userId: string,
    oldTokenId: string,
    tokenId: string,
    token: string,
    tokenExpires: Date,
  ): Promise<boolean>;
  removeRefreshToken(userId: string, tokenId: string): Promise<void>;
  trimRefreshTokens(userId: string, maxTokens?: number): Promise<void>;
  clearTokens(id: string): Promise<void>;
}
