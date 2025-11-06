import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { RefreshToken } from './refresh-token.entity';
import { IPassword } from '../interfaces/iPassword';
import { Provider } from '../../utils/interfaces';

@Injectable()
export class PgPasswordService implements IPassword {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async changePassword(_id: string, password: string) {
    await this.userRepository.update({ _id }, { password });
  }

  async updatePasswordAndClearTokens(
    email: string,
    hashedPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['refreshTokens'],
    });

    if (!user) return;

    // delete all refresh tokens
    await this.refreshTokenRepository.delete({ userId: user._id });

    // update the password and set provider to LOCAL
    user.password = hashedPassword;
    user.provider = Provider.LOCAL;

    await this.userRepository.save(user);
  }

  async setNewPasswordFromResetToken(
    token: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: token },
      relations: ['refreshTokens'],
    });

    if (!user) return;

    // delete refresh tokens
    await this.refreshTokenRepository.delete({ userId: user._id });

    // set new password and clear reset token fields
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;

    await this.userRepository.save(user);
  }

  async remindPassword(
    email: string,
    resetToken: string,
    passwordResetTokenExpires: number,
  ): Promise<void> {
    await this.userRepository.update(
      { email },
      {
        passwordResetToken: resetToken,
        passwordResetTokenExpires,
      },
    );
  }
}
