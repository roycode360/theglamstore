import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CompanySettingsDocument,
  CompanySettingsModel,
} from './schemas/company-settings.schema';
import { UpsertCompanySettingsInput } from './dto/upsert-company-settings.input';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(CompanySettingsModel.name)
    private readonly companyModel: Model<CompanySettingsDocument>,
  ) {}

  async getSettings(): Promise<(CompanySettingsModel & { _id: any }) | null> {
    const doc = await this.companyModel.findOne().lean();
    if (!doc) {
      return null;
    }
    return {
      ...doc,
      promoEnabled: Boolean(doc.promoEnabled),
    };
  }

  async upsertSettings(
    input: UpsertCompanySettingsInput,
  ): Promise<CompanySettingsModel & { _id: any }> {
    type FounderPayload = {
      name: string;
      title?: string;
      bio?: string;
      imageUrl: string;
      order?: number;
      visible?: boolean;
    };

    let foundersPayload: FounderPayload[] | undefined;
    if (Array.isArray(input.founders)) {
      const items = input.founders as Array<{
        name: string;
        title?: string;
        bio?: string;
        imageUrl: string;
        order?: number;
        visible?: boolean;
      }>;
      foundersPayload = items.map(
        (f): FounderPayload => ({
          name: f.name,
          imageUrl: f.imageUrl,
          ...(f.title ? { title: f.title } : {}),
          ...(f.bio ? { bio: f.bio } : {}),
          order: typeof f.order === 'number' ? f.order : 0,
          visible: typeof f.visible === 'boolean' ? f.visible : true,
        }),
      );
    }

    const payload: Partial<CompanySettingsModel> = {
      businessName: input.businessName,
      accountName: input.accountName,
      accountNumber: input.accountNumber,
      bankName: input.bankName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      address: input.address,
      accountInstructions: input.accountInstructions,
      promoEnabled:
        typeof input.promoEnabled === 'boolean'
          ? input.promoEnabled
          : undefined,
      promoTitle: input.promoTitle ?? null,
      promoSubtitle: input.promoSubtitle ?? null,
      promoMessage: input.promoMessage ?? null,
      promoImageUrl: input.promoImageUrl ?? null,
      promoCtaLabel: input.promoCtaLabel ?? null,
      promoCtaLink: input.promoCtaLink ?? null,
      promoDelaySeconds:
        input.promoDelaySeconds != null ? input.promoDelaySeconds : null,
      founders: foundersPayload,
    };

    if (payload.promoEnabled === undefined) {
      delete payload.promoEnabled;
    }

    const doc = await this.companyModel
      .findOneAndUpdate({}, payload, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      })
      .lean<CompanySettingsModel & { _id: any }>();

    if (!doc) {
      throw new Error('Unable to persist company settings');
    }

    return {
      ...doc,
      promoEnabled: Boolean(doc.promoEnabled),
    };
  }
}
