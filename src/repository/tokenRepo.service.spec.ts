import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokenRepoService } from './tokenRepo.service';

describe('TokenRepoService', () => {
  let service: TokenRepoService;
  let repository: Record<string, jest.Mock>;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      find: jest.fn(),
      countBy: jest.fn(),
      create: jest.fn((value) => value as RefreshToken),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new TokenRepoService(
      repository as unknown as Repository<RefreshToken>,
    );
  });

  it('looks up one token by user and token id', async () => {
    repository.findOne!.mockResolvedValue({ token: 'argon-hash' } as RefreshToken);

    await expect(service.findRefreshToken('user-1', 'token-1')).resolves.toBe(
      'argon-hash',
    );
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { userId: 'user-1', tokenId: 'token-1' },
      select: ['token'],
    });
  });

  it('replaces the identified row with the new id, hash, and expiry', async () => {
    repository.update!.mockResolvedValue({ affected: 1 } as never);
    const expiry = new Date('2026-12-01T00:00:00Z');

    await expect(
      service.replaceRefreshToken(
        'user-1',
        'old-id',
        'new-id',
        'new-hash',
        expiry,
      ),
    ).resolves.toBe(true);
    expect(repository.update).toHaveBeenCalledWith(
      { userId: 'user-1', tokenId: 'old-id' },
      { token: 'new-hash', tokenId: 'new-id', tokenExpires: expiry },
    );
  });

  it('trims the earliest-expiring tokens first', async () => {
    const earliest = { tokenId: 'earliest' } as RefreshToken;
    const next = { tokenId: 'next' } as RefreshToken;
    const retained = { tokenId: 'retained' } as RefreshToken;
    repository.countBy!.mockResolvedValue(3);
    repository.find!.mockResolvedValue([earliest, next]);

    await service.trimRefreshTokens('user-1', 1);

    expect(repository.countBy).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(repository.find).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: ['tokenId'],
      order: { tokenExpires: 'ASC', tokenId: 'ASC' },
      take: 2,
    });
    expect(repository.delete).toHaveBeenCalledWith(['earliest', 'next']);
  });
});
