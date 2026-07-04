import { Module } from '@nestjs/common';
import { NotionModule } from '../notion/notion.module';
import { SchemaDriftController } from './schema-drift.controller';

@Module({
  imports: [NotionModule],
  controllers: [SchemaDriftController],
})
export class SchemaDriftModule {}
