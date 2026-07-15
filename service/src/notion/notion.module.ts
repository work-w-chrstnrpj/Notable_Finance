import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { MappingModule } from '../mapping/mapping.module';
import { ValidationModule } from '../validation/validation.module';
import { UserConfigModule } from '../user-config/user-config.module';
import { NotionClientFactory } from './notion-client-factory.service';
import { NotionService } from './notion.service';
import { LiveCacheManager } from './live-cache-manager';
import { NotionReportingService } from './notion-reporting.service';
import { NotionQueryService } from './notion-query.service';
import { NotionMutationService } from './notion-mutation.service';
import { NotionSyncService } from './notion-sync.service';

@Module({
  imports: [ConfigModule, MappingModule, ValidationModule, UserConfigModule],
  providers: [
    NotionService,
    NotionClientFactory,
    LiveCacheManager,
    NotionReportingService,
    NotionQueryService,
    NotionMutationService,
    NotionSyncService,
  ],
  exports: [NotionService],
})
export class NotionModule {}
