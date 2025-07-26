export interface IToken {
  addRefreshToken(id: string, token: string): Promise<void>;
  replaceRefreshToken(
    id: string,
    oldToken: string,
    newToken: string,
  ): Promise<void>;
  removeRefreshToken(userId: string, token: string): Promise<void>;
  trimRefreshTokens(userId: string, maxTokens?: number): Promise<void>;
  clearTokens(id: string);
}
