import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CompanySettingsDocument = HydratedDocument<CompanySettingsModel>;

@Schema({ timestamps: true, collection: 'company_settings' })
export class CompanySettingsModel {
  @Prop({ type: String })
  businessName?: string;

  @Prop({ type: String })
  accountName?: string;

  @Prop({ type: String })
  accountNumber?: string;

  @Prop({ type: String })
  bankName?: string;

  @Prop({ type: String })
  contactEmail?: string;

  @Prop({ type: String })
  contactPhone?: string;

  @Prop({ type: String })
  address?: string;

  @Prop({ type: String })
  accountInstructions?: string;

  @Prop({ type: Boolean, default: false })
  promoEnabled!: boolean;

  @Prop({ type: String, default: null })
  promoTitle?: string | null;

  @Prop({ type: String, default: null })
  promoSubtitle?: string | null;

  @Prop({ type: String, default: null })
  promoMessage?: string | null;

  @Prop({ type: String, default: null })
  promoImageUrl?: string | null;

  @Prop({ type: String, default: null })
  promoCtaLabel?: string | null;

  @Prop({ type: String, default: null })
  promoCtaLink?: string | null;

  @Prop({ type: Number, default: 0 })
  promoDelaySeconds?: number | null;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        title: { type: String },
        bio: { type: String },
        imageUrl: { type: String, required: true },
        order: { type: Number, default: 0 },
        visible: { type: Boolean, default: true },
      },
    ],
    default: [],
  })
  founders?: {
    name: string;
    title?: string;
    bio?: string;
    imageUrl: string;
    order?: number;
    visible?: boolean;
  }[];
}

export const CompanySettingsSchema =
  SchemaFactory.createForClass(CompanySettingsModel);
