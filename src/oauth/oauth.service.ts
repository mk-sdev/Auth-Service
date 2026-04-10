import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserCrudRepoService } from '../repository/userCrudRepo.service';
import { CoreService } from '../core/core.service';
import { Provider } from '../utils/interfaces';
import { Request } from 'express';
import { User } from 'src/repository/entities/user.entity';

export type LoginResult =
  | { access_token: string; refresh_token: string }
  | { requires2FA: true; tempToken: string };

@Injectable()
export class OAuthService {
  constructor(
    private readonly coreService: CoreService,
    private readonly userCrudRepoService: UserCrudRepoService,
  ) {}

  async fn(
    reqUser: { email: string; emailVerified: boolean },
    req: Request,
  ): Promise<LoginResult> {
    const { email, emailVerified } = reqUser;

    if (!emailVerified) {
      throw new UnauthorizedException('Google email not verified');
    }

    let user: User | null =
      await this.userCrudRepoService.findOneByEmail(email);

    if (!user) {
      user = await this.userCrudRepoService.insertOne_OAuth(
        email,
        Provider.GOOGLE,
      );
    }

    return this.coreService.login(user.email, req, undefined);
  }
}