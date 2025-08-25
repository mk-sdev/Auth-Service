import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  OneToMany,
  Relation,
} from 'typeorm';
import { Provider } from '../../utils/interfaces';
import { RefreshToken } from './refresh-token.entity';
import { UserRole } from './user-role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  password?: string;

  @OneToMany(() => UserRole, (role) => role.user, { cascade: true })
  roles: Relation<UserRole[]>;

  @OneToMany(() => RefreshToken, (token) => token.user, { cascade: true })
  refreshTokens: Relation<RefreshToken[]>;

  @Column({
    type: 'enum',
    enum: Provider,
    default: Provider.LOCAL,
  })
  provider: Provider;

  @Column({ name: 'isverified', type: 'boolean', default: false })
  isVerified: boolean;

  @Index({ unique: true, where: '"verificationtoken" IS NOT NULL' })
  @Column({ name: 'verificationtoken', type: 'varchar', nullable: true })
  verificationToken?: string | null;

  @Column({ name: 'verificationtokenexpires', type: 'bigint', nullable: true })
  verificationTokenExpires?: number | null;

  @Column({ name: 'pendingemail', type: 'varchar', nullable: true })
  pendingEmail?: string | null;

  @Index({ unique: true, where: '"emailchangetoken" IS NOT NULL' })
  @Column({ name: 'emailchangetoken', type: 'varchar', nullable: true })
  emailChangeToken?: string | null;

  @Column({ name: 'emailchangetokenexpires', type: 'bigint', nullable: true })
  emailChangeTokenExpires?: number | null;

  @Index({ unique: true, where: '"passwordresettoken" IS NOT NULL' })
  @Column({ name: 'passwordresettoken', type: 'varchar', nullable: true })
  passwordResetToken?: string | null;

  @Column({ name: 'passwordresettokenexpires', type: 'bigint', nullable: true })
  passwordResetTokenExpires?: number | null;

  @Column({ name: 'isdeletionpending', type: 'boolean', default: false })
  isDeletionPending?: boolean | null;

  @Column({ name: 'deletionscheduledat', type: 'bigint', nullable: true })
  deletionScheduledAt?: number | null;
}
