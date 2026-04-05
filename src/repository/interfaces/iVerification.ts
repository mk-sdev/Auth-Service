import { User } from '../entities/user.entity';

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
  ): Promise<User | null>;
  findOneByEmailToken(token: string): Promise<User | null>;
  findOneByPasswordResetToken(
    token: string,
  ): Promise<User | null>;
}
