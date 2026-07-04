import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { MappingModule } from '../mapping/mapping.module';
import { ValidationModule } from '../validation/validation.module';
import { NotionService } from './notion.service';

@Module({
  imports: [ConfigModule, MappingModule, ValidationModule],
  providers: [NotionService],
  exports: [NotionService],
})
export class NotionModule {}
