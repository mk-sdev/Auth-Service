import { Injectable } from '@nestjs/common';
import { UserDocument } from '../repository/mongo/user.schema';
import { UserCrudRepoService } from '../repository/userCrudRepo.service';
import { CoreService } from '../core/core.service';
import { Provider } from '../utils/interfaces';

@Injectable()
export class OAuthService {
  constructor(
    private readonly coreService: CoreService,
    private readonly userCrudRepoService: UserCrudRepoService,
  ) {}

  async fn(reqUser: { email: string; emailVerified: boolean }) {
    const { email, emailVerified } = reqUser;

    let user: UserDocument | null =
      await this.userCrudRepoService.findOneByEmail(email);

    if (!user) {
      user = await this.userCrudRepoService.insertOne_OAuth(
        email,
        Provider.GOOGLE,
      );
    }

    const tokens = await this.coreService.login(user.email);

    return tokens;
  }
}
