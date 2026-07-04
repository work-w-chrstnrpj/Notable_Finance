import { Module } from '@nestjs/common';
import { NotionModule } from '../notion/notion.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [NotionModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
