import { Injectable } from '@nestjs/common';
import { IUserCrud } from '../interfaces/iUserCrud';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { SafeUserDto } from 'src/dtos/safeUser.dto';
import { Provider } from 'src/utils/interfaces';

@Injectable()
export class PgUserCrudService implements IUserCrud {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(_id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { _id } });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async getAllUsers(): Promise<Pick<User, 'email'>[]> {
    return await this.userRepository.find({ select: ['email'] });
  }

  async getUsers(n: number, i: number): Promise<Pick<User, 'email'>[]> {
    return await this.userRepository.find({
      select: ['email'],
      skip: n * i, // pomiń pierwsze n*i rekordów
      take: n, // pobierz n rekordów
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
    });
    return await this.userRepository.save(user);
  }

  async insertOne_OAuth(email: string, provider: Provider): Promise<User> {
    const user = this.userRepository.create({
      email,
      provider: provider,
      isVerified: true,
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

    // usuń stare role i dodaj nowe
    user.roles = roles.map((role) =>
      this.userRepository.manager.create('UserRole', { role, user }),
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
}
