import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
  Relation,
} from 'typeorm';
import { User } from './user.entity';
import { Role } from '../../utils/interfaces';

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({
    type: 'enum',
    enum: Role,
  })
  role: Role;

  @ManyToOne(() => User, (user) => user.roles, {
    onDelete: 'CASCADE',
  })
  user: Relation<User>;
}
