import { Module } from '@nestjs/common';
import { NotionModule } from '../notion/notion.module';
import { ExpenseSchedulerController } from './expense-scheduler.controller';

@Module({
  imports: [NotionModule],
  controllers: [ExpenseSchedulerController],
})
export class ExpenseSchedulerModule {}
