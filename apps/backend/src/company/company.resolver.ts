import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanySettings } from './entities/company-settings.entity';
import { UpsertCompanySettingsInput } from './dto/upsert-company-settings.input';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { isPublic } from '../auth/decorators';

@Resolver(() => CompanySettings)
export class CompanyResolver {
  constructor(private readonly companyService: CompanyService) {}

  @isPublic()
  @Query(() => CompanySettings, { nullable: true })
  async companySettings(): Promise<CompanySettings | null> {
    const doc = await this.companyService.getSettings();
    return doc ? (doc as unknown as CompanySettings) : null;
  }

  @UseGuards(RolesGuard)
  @Mutation(() => CompanySettings)
  @Roles('admin')
  async upsertCompanySettings(
    @Args('input') input: UpsertCompanySettingsInput,
  ): Promise<CompanySettings> {
    const doc = await this.companyService.upsertSettings(input);
    return doc as unknown as CompanySettings;
  }
}
