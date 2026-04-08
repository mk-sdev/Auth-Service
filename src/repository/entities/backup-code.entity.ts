import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    Relation
} from 'typeorm';
import { User } from './user.entity';

@Entity('backup_codes')
export class BackupCode {
    @PrimaryColumn({ type: 'text' })
    code: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string; // FK

    @ManyToOne(() => User, (user) => user.backupCodes, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: Relation<User>;
}
