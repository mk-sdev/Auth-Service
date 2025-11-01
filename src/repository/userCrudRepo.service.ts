import { Injectable } from '@nestjs/common';
import { IUserCrud } from './interfaces/iUserCrud';
import { MongoUserCrudService } from './mongo/mongoUserCrud.service';
import { SafeUserDto } from '../dtos/safe-user.dto';
import { UserDocument } from './mongo/user.schema';
import { Provider } from '../utils/interfaces';
import { PgUserCrudService } from './pg/pgUserCrud.service';
import { User } from './pg/user.entity';

@Injectable()
export class UserCrudRepoService implements IUserCrud {
  private readonly repoService: IUserCrud;

  constructor(
    private readonly mongoService: MongoUserCrudService,
    private readonly pgService: PgUserCrudService,
  ) {
    if (process.env.DB_TYPE === 'mongo') {
      this.repoService = this.mongoService;
    } else this.repoService = this.pgService;
  }

  async findOne(id: string): Promise<UserDocument | User | null> {
    return this.repoService.findOne(id);
  }

  async findOneByEmail(email: string): Promise<UserDocument | User | null> {
    return this.repoService.findOneByEmail(email);
  }

  async getAllUsers(): Promise<UserDocument[] | Pick<User, 'email'>[] | null> {
    return await this.repoService.getAllUsers();
  }

  async getUsers(
    n: number,
    i: number,
  ): Promise<UserDocument[] | Pick<User, 'email'>[] | null> {
    return await this.repoService.getUsers(n, i);
  }

  async insertOne({
    email,
    password,
    verificationToken,
    verificationTokenExpires,
  }: {
    email: string;
    password: string;
    verificationToken: string;
    verificationTokenExpires: number;
  }): Promise<UserDocument | User> {
    return this.repoService.insertOne({
      email,
      password,
      verificationToken,
      verificationTokenExpires,
    });
  }

  async insertOne_OAuth(
    email: string,
    provider: Provider,
  ): Promise<UserDocument | User> {
    return await this.repoService.insertOne_OAuth(email, provider);
  }

  async moderateUser(
    _id: string,
    data: Omit<SafeUserDto, '_id'>,
  ): Promise<void> {
    await this.repoService.moderateUser(_id, data);
  }

  async verifyAccount(id: string): Promise<void> {
    return this.repoService.verifyAccount(id);
  }

  async confirmEmailChange(userId: string, newEmail: string): Promise<void> {
    return this.repoService.confirmEmailChange(userId, newEmail);
  }

  async cancelScheduledDeletion(userId: string): Promise<void> {
    return this.repoService.cancelScheduledDeletion(userId);
  }

  async markUserForDeletion(
    email: string,
    deletionScheduledAt: number,
  ): Promise<void> {
    return this.repoService.markUserForDeletion(email, deletionScheduledAt);
  }
}
