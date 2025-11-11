import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpsertDeliveryLocationInput } from './dto/upsert-delivery-location.input';
import { DeliveryLocation } from './entities/delivery-location.entity';
import {
  DeliveryLocationDocument,
  DeliveryLocationModel,
} from './schemas/delivery-location.schema';

@Injectable()
export class DeliveryLocationsService {
  constructor(
    @InjectModel(DeliveryLocationModel.name)
    private model: Model<DeliveryLocationDocument>,
  ) {}

  async list(): Promise<DeliveryLocation[]> {
    const docs = await this.model.find().sort({ name: 1 }).lean();
    return docs.map(this.mapDoc);
  }

  async upsert(
    input: UpsertDeliveryLocationInput,
  ): Promise<DeliveryLocation> {
    if (input._id) {
      const doc = await this.model
        .findByIdAndUpdate(
          input._id,
          {
            name: input.name,
            price: input.price,
            active: input.active,
            isDefault: input.isDefault,
          },
          { new: true },
        )
        .lean();
      if (!doc) throw new Error('Location not found');
      await this.ensureDefaultConstraint(doc._id, input.isDefault);
      return this.mapDoc({ ...doc, isDefault: input.isDefault });
    }
    const created = await this.model.create({
      name: input.name,
      price: input.price,
      active: input.active,
      isDefault: input.isDefault,
    });
    await this.ensureDefaultConstraint(created._id, input.isDefault);
    return this.mapDoc(created.toObject());
  }

  async remove(id: string): Promise<boolean> {
    const res = await this.model.findByIdAndDelete(id);
    return !!res;
  }

  private mapDoc = (doc: {
    _id: unknown;
    name?: string;
    price?: number;
    active?: boolean;
    isDefault?: boolean;
  }): DeliveryLocation => ({
    _id: String(doc._id),
    name: doc.name ?? '',
    price: Number(doc.price ?? 0),
    active: !!doc.active,
    isDefault: !!doc.isDefault,
  });

  private async ensureDefaultConstraint(
    id: unknown,
    isDefault: boolean,
  ): Promise<void> {
    if (!isDefault) {
      return;
    }
    await this.model.updateMany(
      { _id: { $ne: id } },
      { $set: { isDefault: false } },
    );
  }
}


