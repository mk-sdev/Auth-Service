import { Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryColumn({ type: 'text' })
  token: string;

  @Index()
  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  user: User;
}
