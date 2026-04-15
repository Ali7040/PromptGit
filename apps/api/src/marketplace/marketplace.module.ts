import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { PacksService } from './packs.service';
import { BillingWebhookController } from './billing-webhook.controller';

@Module({
  controllers: [MarketplaceController, BillingWebhookController],
  providers: [MarketplaceService, PacksService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
