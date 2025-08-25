import { UserDocument } from '../mongo/user.schema';
import { User } from '../pg/user.entity';

export interface IVerification {
  setNewVerificationToken(
    email: string,
    password: string,
    token: string,
    expiresAt: number,
  ): Promise<void>;
  markEmailChangePending(
    id: string,
    pendingEmail: string,
    emailChangeToken: string,
    emailChangeTokenExpires: number,
  ): Promise<void>;
  findOneByVerificationToken(
    token: string,
  ): Promise<UserDocument | User | null>;
  findOneByEmailToken(token: string): Promise<UserDocument | User | null>;
  findOneByPasswordResetToken(
    token: string,
  ): Promise<UserDocument | User | null>;
}
