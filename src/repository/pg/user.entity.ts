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

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Index({ unique: true, where: '"verification_token" IS NOT NULL' })
  @Column({ name: 'verification_token', type: 'varchar', nullable: true })
  verificationToken?: string | null;

  @Column({
    name: 'verification_token_expires',
    type: 'bigint',
    nullable: true,
  })
  verificationTokenExpires?: number | null;

  @Column({ name: 'pending_email', type: 'varchar', nullable: true })
  pendingEmail?: string | null;

  @Index({ unique: true, where: '"email_change_token" IS NOT NULL' })
  @Column({ name: 'email_change_token', type: 'varchar', nullable: true })
  emailChangeToken?: string | null;

  @Column({
    name: 'email_change_token_expires',
    type: 'bigint',
    nullable: true,
  })
  emailChangeTokenExpires?: number | null;

  @Index({ unique: true, where: '"password_reset_token" IS NOT NULL' })
  @Column({ name: 'password_reset_token', type: 'varchar', nullable: true })
  passwordResetToken?: string | null;

  @Column({
    name: 'password_reset_token_expires',
    type: 'bigint',
    nullable: true,
  })
  passwordResetTokenExpires?: number | null;

  @Column({ name: 'is_deletion_pending', type: 'boolean', default: false })
  isDeletionPending?: boolean | null;

  @Column({ name: 'deletion_scheduled_at', type: 'bigint', nullable: true })
  deletionScheduledAt?: number | null;
}
