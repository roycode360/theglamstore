import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type UserEventDocument = HydratedDocument<UserEventModel>;

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'user_events',
})
export class UserEventModel {
  @Prop({ type: String, required: true })
  eventType!: string;

  @Prop({ type: String, default: null })
  userId?: string | null;

  @Prop({ type: String, default: null })
  sessionId?: string | null;

  @Prop({ type: String, default: null })
  source?: string | null;

  @Prop({ type: String, default: null })
  medium?: string | null;

  @Prop({ type: String, default: null })
  campaign?: string | null;

  @Prop({ type: String, default: null })
  page?: string | null;

  @Prop({ type: String, default: null })
  productId?: string | null;

  @Prop({ type: Number, default: null })
  durationMs?: number | null;

  @Prop({ type: String, default: null })
  device?: string | null;

  @Prop({ type: String, default: null })
  country?: string | null;

  @Prop({ type: SchemaTypes.Mixed, default: null })
  metadata?: Record<string, unknown> | null;

  createdAt!: Date;
}

export const UserEventSchema = SchemaFactory.createForClass(UserEventModel);

UserEventSchema.index({ createdAt: -1 });
UserEventSchema.index({ eventType: 1, createdAt: -1 });
UserEventSchema.index({ userId: 1, createdAt: -1 });
UserEventSchema.index({ sessionId: 1, createdAt: -1 });
UserEventSchema.index({ productId: 1, createdAt: -1 });

