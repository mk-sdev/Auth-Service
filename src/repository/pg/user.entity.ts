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

  @Column({ default: false })
  isVerified: boolean;

  @Index({ unique: true, where: 'verificationToken IS NOT NULL' })
  @Column({ type: 'varchar', nullable: true })
  verificationToken?: string | null;

  @Column({ type: 'bigint', nullable: true })
  verificationTokenExpires?: number | null;

  @Column({ type: 'varchar', nullable: true })
  pendingEmail?: string | null;

  @Index({ unique: true, where: 'emailChangeToken IS NOT NULL' })
  @Column({ type: 'varchar', nullable: true })
  emailChangeToken?: string | null;

  @Column({ type: 'bigint', nullable: true })
  emailChangeTokenExpires?: number | null;

  @Index({ unique: true, where: 'passwordResetToken IS NOT NULL' })
  @Column({ type: 'varchar', nullable: true })
  passwordResetToken?: string | null;

  @Column({ type: 'bigint', nullable: true })
  passwordResetTokenExpires?: number | null;

  @Column({ type: 'boolean', default: false })
  isDeletionPending?: boolean | null;

  @Column({ type: 'bigint', nullable: true })
  deletionScheduledAt?: number | null;
}
