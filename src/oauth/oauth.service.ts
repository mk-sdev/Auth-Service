import { Injectable } from '@nestjs/common';
import { UserCrudRepoService } from '../repository/userCrudRepo.service';
import { CoreService } from '../core/core.service';
import { Provider } from '../utils/interfaces';
import { Request } from 'express';
import { User } from 'src/repository/entities/user.entity';

@Injectable()
export class OAuthService {
  constructor(
    private readonly coreService: CoreService,
    private readonly userCrudRepoService: UserCrudRepoService,
  ) { }

  async fn(reqUser: { email: string; emailVerified: boolean }, req: Request) {
    const { email, emailVerified } = reqUser;

    let user: User | null =
      await this.userCrudRepoService.findOneByEmail(email);

    if (!user) {
      user = await this.userCrudRepoService.insertOne_OAuth(
        email,
        Provider.GOOGLE,
      );
    }

    const tokens = await this.coreService.login(user.email, req);

    return tokens;
  }
}
