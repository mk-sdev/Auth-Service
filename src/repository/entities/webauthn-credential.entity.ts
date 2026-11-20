import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { User } from './user.entity';

@Entity('webauthn_credentials')
export class WebAuthnCredential {
  @PrimaryColumn({ name: 'credential_id', type: 'text' })
  credentialId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'public_key', type: 'text' })
  publicKey: string;

  @Column({ name: 'sign_count', type: 'bigint', default: 0 })
  signCount: string;

  @Column({ name: 'name', type: 'varchar', length: 80 })
  name: string;

  @ManyToOne(() => User, (user) => user.webAuthnCredentials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;
}
