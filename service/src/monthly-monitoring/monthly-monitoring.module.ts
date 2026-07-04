import { Module } from '@nestjs/common';
import { NotionModule } from '../notion/notion.module';
import { MonthlyMonitoringController } from './monthly-monitoring.controller';

@Module({
  imports: [NotionModule],
  controllers: [MonthlyMonitoringController],
})
export class MonthlyMonitoringModule {}
