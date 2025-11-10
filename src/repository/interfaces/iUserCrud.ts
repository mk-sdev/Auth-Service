import { Provider, Role } from '../../utils/interfaces';
import { SafeUserDto } from '../../dtos/safe-user.dto';
import { UserDocument } from '../mongo/user.schema';
import { User } from '../pg/user.entity';

export interface IUserCrud {
  findOne(id: string): Promise<UserDocument | User | null>;
  findOneByEmail(email: string): Promise<UserDocument | User | null>;
  getAllUsers(): Promise<UserDocument[] | Pick<User, 'email'>[] | null>;
  getUsers(
    n: number,
    i: number,
  ): Promise<UserDocument[] | Pick<User, 'email'>[] | null>;
  insertOne({
    email,
    password,
    verificationToken,
    verificationTokenExpires,
  }: {
    email: string;
    password: string;
    verificationToken: string;
    verificationTokenExpires: number;
  }): Promise<UserDocument | User>;
  insertOne_OAuth(
    email: string,
    provider: Provider,
  ): Promise<UserDocument | User>;
  moderateUser(
    _id: string,
    { email, roles, isVerified }: Omit<SafeUserDto, '_id'>,
  ): Promise<void>;
  verifyAccount(id: string): Promise<void>;
  confirmEmailChange(userId: string, newEmail: string): Promise<void>;
  cancelScheduledDeletion(userId: string): Promise<void>;
  markUserForDeletion(
    email: string,
    deletionScheduledAt: number,
  ): Promise<void>;
  getUserRoles(id: string): Promise<Role[]>;
}
