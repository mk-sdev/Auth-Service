import { UserDocument } from '../mongo/user.schema';

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
  findOneByVerificationToken(token: string): Promise<UserDocument | null>;
  findOneByEmailToken(token: string): Promise<UserDocument | null>;
  findOneByPasswordResetToken(token: string): Promise<UserDocument | null>;
}
