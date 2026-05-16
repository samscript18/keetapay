import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { IdentityCertificate } from "../identity.types";

export type IdentityRecordDocument = HydratedDocument<IdentityRecord>;

@Schema({ timestamps: true })
export class IdentityRecord {
  @Prop({ required: true, unique: true, index: true })
  walletAddress!: string;

  @Prop({ type: Object, required: true })
  certificate!: IdentityCertificate;
}

export const IdentityRecordSchema = SchemaFactory.createForClass(IdentityRecord);
