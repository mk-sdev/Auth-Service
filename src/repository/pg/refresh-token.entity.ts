import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryColumn({ type: 'text' })
  token: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string; // FK

  //@Index()
  // @ManyToOne(() => User, (user) => user.refreshTokens, {
  //   onDelete: 'CASCADE',
  // })
  // user: User;
}
