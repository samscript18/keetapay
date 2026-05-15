import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  privyUserId!: string;

  @Prop({ unique: true, sparse: true, lowercase: true, trim: true })
  username?: string;

  @Prop({ required: true })
  walletAddress!: string;

  @Prop({ required: true, select: false })
  encryptedSeed!: string;

  @Prop({ default: '' })
  profileImage!: string;

  @Prop({ default: 'Making crypto feel like a message.' })
  bio!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
