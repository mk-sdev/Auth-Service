import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SafeUserDto } from 'src/dtos/safe-user.dto';
import { Provider, Role } from '../utils/interfaces';
import { Repository } from 'typeorm';
import { IUserCrud } from './interfaces/iUserCrud';
import { UserRole } from './entities/user-role.entity';
import { User } from './entities/user.entity';

@Injectable()
export class UserCrudRepoService implements IUserCrud {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly roleRepository: Repository<UserRole>,
  ) { }

  // // 🔹 1. Włączenie 2FA
  // async enableTwoFactor(userId: string): Promise<void> {
  //   await this.userRepository.update(userId, {
  //     isTwoFactorEnabled: true,
  //   });
  // }

  // // 🔹 2. Wyłączenie 2FA i czyszczenie OTP
  // async disableTwoFactor(userId: string): Promise<void> {
  //   await this.userRepository.update(userId, {
  //     isTwoFactorEnabled: false,
  //     twoFactorOtp: null,
  //     twoFactorOtpExpires: null,
  //   });
  // }

  // // 🔹 3. Ustawienie OTP (czysto zapis do bazy)
  // async setTwoFactorOtp(userId: string, otp: string | null, expiresAt: Date | null): Promise<void> {
  //   await this.userRepository.update(userId, {
  //     twoFactorOtp: otp,
  //     twoFactorOtpExpires: expiresAt,
  //   });
  // }

  // // 🔹 4. Pobranie OTP i daty wygaśnięcia (do weryfikacji w serwisie)
  // async getTwoFactorOtp(userId: string): Promise<{ otp: string; expiresAt: Date } | null> {
  //   const user = await this.userRepository.findOne({
  //     where: { _id: userId },
  //     select: ['twoFactorOtp', 'twoFactorOtpExpires'],
  //   });

  //   if (!user || !user.twoFactorOtp || !user.twoFactorOtpExpires) return null;

  //   return { otp: user.twoFactorOtp, expiresAt: user.twoFactorOtpExpires };
  // }

  // // 🔹 5. Pobranie stanu 2FA (czy włączona)
  // async isTwoFactorEnabled(userId: string): Promise<boolean> {
  //   const user = await this.userRepository.findOne({
  //     where: { _id: userId },
  //     select: ['isTwoFactorEnabled'],
  //   });
  //   return user?.isTwoFactorEnabled || false;
  // }

  async findOne(_id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { _id } });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email }, relations: ['roles'] });
  }

  async getAllUsers(): Promise<Pick<User, 'email'>[]> {
    return await this.userRepository.find({ select: ['email'] });
  }

  async getUsers(n: number, i: number): Promise<Pick<User, 'email'>[]> {
    return await this.userRepository.find({
      select: ['email'],
      skip: n * i, // skip n*i records
      take: n, // take n records
    });
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
  }): Promise<User> {
    const user = this.userRepository.create({
      email,
      password,
      verificationToken,
      verificationTokenExpires,
      roles: [
        {
          role: Role.USER,
        },
      ],
    });

    return await this.userRepository.save(user);
  }

  async insertOne_OAuth(email: string, provider: Provider): Promise<User> {
    const user = this.userRepository.create({
      email,
      provider,
      isVerified: true,
      roles: [{ role: Role.USER }],
    });

    return await this.userRepository.save(user);
  }

  async moderateUser(
    _id: string,
    { email, roles, isVerified }: Omit<SafeUserDto, '_id'>,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { _id },
      relations: ['roles'],
    });

    if (!user) return;

    user.email = email;
    user.isVerified = isVerified;

    // remove old roles
    await this.roleRepository.remove(user.roles);

    // add new roles
    user.roles = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/require-await
      roles.map(async (role) => {
        const userRole = this.userRepository.manager.create(UserRole, {
          role,
          user, // assign user to correctly set up user_id
        });
        return userRole;
      }),
    );

    await this.userRepository.save(user);
  }

  async verifyAccount(_id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { _id } });
    if (!user) return;

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;

    await this.userRepository.save(user);
  }

  async confirmEmailChange(userId: string, newEmail: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { _id: userId } });
    if (!user) return;

    user.email = newEmail;
    user.pendingEmail = null;
    user.emailChangeToken = null;
    user.emailChangeTokenExpires = null;

    await this.userRepository.save(user);
  }

  async cancelScheduledDeletion(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { _id: userId } });
    if (!user) return;

    user.isDeletionPending = null;
    user.deletionScheduledAt = null;

    await this.userRepository.save(user);
  }

  async markUserForDeletion(
    email: string,
    deletionScheduledAt: number,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return;

    user.isDeletionPending = true;
    user.deletionScheduledAt = deletionScheduledAt;

    await this.userRepository.save(user);
  }

  async getUserRoles(id: string): Promise<Role[]> {
    const user = await this.userRepository.findOne({
      where: { _id: id },
      relations: ['roles'],
    });

    if (!user || user.roles.length === 0) {
      throw new NotFoundException('User roles not found');
    }

    return user.roles.map((userRole) => userRole.role);
  }
}
