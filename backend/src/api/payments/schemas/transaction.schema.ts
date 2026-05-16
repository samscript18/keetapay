import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  fromUserId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", index: true })
  toUserId?: Types.ObjectId;

  @Prop()
  toWalletAddress?: string;

  @Prop({ required: true })
  amount!: string;

  @Prop({ default: "" })
  message!: string;

  @Prop({ sparse: true, index: true })
  blockHash?: string;

  @Prop({ required: true, unique: true })
  txHash!: string;

  @Prop({ default: false, index: true })
  isPrivate!: boolean;

  @Prop({ default: "main" })
  network!: "main" | "private-subnet";

  @Prop({ type: Object })
  senderIdentityProof?: Record<string, unknown>;

  @Prop({ type: Object })
  recipientIdentityProof?: Record<string, unknown>;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
