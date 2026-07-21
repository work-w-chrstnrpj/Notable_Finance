import { Module } from '@nestjs/common';
import { NotionModule } from '../notion/notion.module';
import { ExpensesController } from './expenses.controller';

@Module({
  imports: [NotionModule],
  controllers: [ExpensesController],
})
export class ExpensesModule {}
