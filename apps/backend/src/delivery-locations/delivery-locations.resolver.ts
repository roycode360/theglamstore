import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DeliveryLocationsService } from './delivery-locations.service';
import { DeliveryLocation } from './entities/delivery-location.entity';
import { isPublic } from '../auth/decorators';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { UpsertDeliveryLocationInput } from './dto/upsert-delivery-location.input';

@Resolver(() => DeliveryLocation)
export class DeliveryLocationsResolver {
  constructor(private readonly svc: DeliveryLocationsService) {}

  @isPublic()
  @Query(() => [DeliveryLocation], { name: 'getDeliveryLocations' })
  async getDeliveryLocations(): Promise<DeliveryLocation[]> {
    return this.svc.list();
  }

  @isPublic()
  @Query(() => [DeliveryLocation], { name: 'listDeliveryLocations' })
  async listDeliveryLocations(): Promise<DeliveryLocation[]> {
    return this.svc.list();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Mutation(() => DeliveryLocation)
  async upsertDeliveryLocation(
    @Args('input') input: UpsertDeliveryLocationInput,
  ): Promise<DeliveryLocation> {
    return this.svc.upsert(input);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Mutation(() => Boolean)
  async deleteDeliveryLocation(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.svc.remove(id);
  }
}


