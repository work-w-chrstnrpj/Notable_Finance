import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { MappingModule } from '../mapping/mapping.module';
import { ValidationModule } from '../validation/validation.module';
import { UserConfigModule } from '../user-config/user-config.module';
import { NotionClientFactory } from './notion-client-factory.service';
import { NotionService } from './notion.service';

@Module({
  imports: [ConfigModule, MappingModule, ValidationModule, UserConfigModule],
  providers: [NotionService, NotionClientFactory],
  exports: [NotionService],
})
export class NotionModule {}
