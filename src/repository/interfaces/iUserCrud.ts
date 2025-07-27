import { Provider } from '../../utils/interfaces';
import { SafeUserDto } from '../../dtos/safeUser.dto';
import { UserDocument } from '../user.schema';

export interface IUserCrud {
  findOne(id: string): Promise<UserDocument | null>;
  findOneByEmail(email: string): Promise<UserDocument | null>;
  getAllUsers();
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
  }): Promise<UserDocument>;
  insertOne_OAuth(email: string, provider: Provider): Promise<UserDocument>;
  moderateUser(
    _id: string,
    { email, roles, isVerified }: Omit<SafeUserDto, '_id'>,
  );
  verifyAccount(id: string): Promise<void>;
  confirmEmailChange(userId: string, newEmail: string): Promise<void>;
  cancelScheduledDeletion(userId: string): Promise<void>;
  markUserForDeletion(
    email: string,
    deletionScheduledAt: number,
  ): Promise<void>;
}
