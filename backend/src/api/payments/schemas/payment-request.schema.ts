import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentRequestDocument = HydratedDocument<PaymentRequest>;

@Schema({ timestamps: true })
export class PaymentRequest {
  @Prop({ required: true, unique: true, index: true })
  code!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipientUserId!: Types.ObjectId;

  @Prop({ required: true })
  amount!: string;

  @Prop({ default: '' })
  message!: string;

  @Prop({ required: true, index: true })
  expiresAt!: Date;

  @Prop({ type: Object })
  recipientIdentityProof?: Record<string, unknown>;
}

export const PaymentRequestSchema = SchemaFactory.createForClass(PaymentRequest);
