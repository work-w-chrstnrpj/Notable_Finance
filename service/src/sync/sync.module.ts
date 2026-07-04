import { Module } from '@nestjs/common';
import { NotionModule } from '../notion/notion.module';
import { SyncController } from './sync.controller';

@Module({
  imports: [NotionModule],
  controllers: [SyncController],
})
export class SyncModule {}
