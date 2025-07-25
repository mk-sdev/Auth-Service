import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from 'src/utils/interfaces';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      message: 'Invalid email format',
    },
  })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [String], enum: Role, default: [Role.USER] })
  roles: Role[];

  @Prop({ default: [] })
  refreshTokens: string[];

  // * for the registration

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ index: true, sparse: true })
  verificationToken?: string;

  @Prop()
  verificationTokenExpires?: number;

  // * for email change

  @Prop()
  pendingEmail?: string; // temporary email address to confirm

  @Prop({ index: true, sparse: true })
  emailChangeToken?: string;

  @Prop()
  emailChangeTokenExpires?: number;

  // * for password change

  @Prop({ index: true, sparse: true })
  passwordResetToken?: string;

  @Prop()
  passwordResetTokenExpires?: number;

  // * for account deletion

  @Prop({ type: Boolean })
  isDeletionPending?: boolean;

  @Prop()
  deletionScheduledAt?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
