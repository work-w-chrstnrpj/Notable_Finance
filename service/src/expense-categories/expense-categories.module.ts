import { Module } from '@nestjs/common';
import { NotionModule } from '../notion/notion.module';
import { ExpenseCategoriesController } from './expense-categories.controller';

@Module({
  imports: [NotionModule],
  controllers: [ExpenseCategoriesController],
})
export class ExpenseCategoriesModule {}
