import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Relation,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
@Index('refresh_tokens_user_id_token_expires_idx', ['userId', 'tokenExpires'])
export class RefreshToken {
  @Column({ type: 'text' })
  token: string;

  @PrimaryColumn({ name: 'token_id', type: 'uuid' })
  tokenId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string; // FK

  @Column({ name: 'token_expires', type: 'timestamptz' })
  tokenExpires: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;
}
