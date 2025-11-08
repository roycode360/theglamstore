import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyResolver } from './company.resolver';
import { CompanyService } from './company.service';
import {
  CompanySettingsModel,
  CompanySettingsSchema,
} from './schemas/company-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CompanySettingsModel.name, schema: CompanySettingsSchema },
    ]),
  ],
  providers: [CompanyResolver, CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
