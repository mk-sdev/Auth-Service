import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { IVerification } from '../interfaces/iVerification';

@Injectable()
export class PgVerificationService implements IVerification {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async setNewVerificationToken(
    email: string,
    password: string,
    token: string,
    expiresAt: number,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return;

    user.password = password;
    user.verificationToken = token;
    user.verificationTokenExpires = expiresAt;

    await this.userRepository.save(user);
  }

  async markEmailChangePending(
    _id: string,
    pendingEmail: string,
    emailChangeToken: string,
    emailChangeTokenExpires: number,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { _id } });
    if (!user) return;

    user.pendingEmail = pendingEmail;
    user.emailChangeToken = emailChangeToken;
    user.emailChangeTokenExpires = emailChangeTokenExpires;

    await this.userRepository.save(user);
  }

  async findOneByVerificationToken(token: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { verificationToken: token },
    });
  }

  async findOneByEmailToken(token: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { emailChangeToken: token },
    });
  }

  async findOneByPasswordResetToken(token: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { passwordResetToken: token },
    });
  }
}
