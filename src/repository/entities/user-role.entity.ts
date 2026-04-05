import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Relation,
  Column,
} from 'typeorm';
import { User } from './user.entity';
import { Role } from '../../utils/interfaces';

@Entity('user_roles')
//@Index('user_role_index', ['role', 'user'], { unique: true })
export class UserRole {
  @PrimaryColumn({
    type: 'enum',
    enum: Role,
  })
  role: Role;

  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string; // FK

  @ManyToOne(() => User, (user) => user.roles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;
}
