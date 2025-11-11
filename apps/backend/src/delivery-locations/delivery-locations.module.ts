import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryLocationsResolver } from './delivery-locations.resolver';
import { DeliveryLocationsService } from './delivery-locations.service';
import {
  DeliveryLocationModel,
  DeliveryLocationSchema,
} from './schemas/delivery-location.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeliveryLocationModel.name, schema: DeliveryLocationSchema },
    ]),
  ],
  providers: [DeliveryLocationsResolver, DeliveryLocationsService],
})
export class DeliveryLocationsModule {}


