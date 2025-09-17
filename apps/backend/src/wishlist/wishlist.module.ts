import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WishlistResolver } from './wishlist.resolver';
import { WishlistService } from './wishlist.service';
import { WishlistItem, WishlistItemSchema } from './wishlist.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WishlistItem.name, schema: WishlistItemSchema },
    ]),
    AuthModule,
  ],
  providers: [WishlistResolver, WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
