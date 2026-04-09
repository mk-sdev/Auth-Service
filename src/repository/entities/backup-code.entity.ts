import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Relation
} from 'typeorm';
import { User } from './user.entity';

@Entity('backup_codes')
export class BackupCode {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;

    @Column({ name: 'code', type: 'text' })
    code: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string; // FK

    @ManyToOne(() => User, (user) => user.backupCodes, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: Relation<User>; // FK
}
