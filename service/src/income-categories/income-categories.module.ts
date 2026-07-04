import { Module } from '@nestjs/common';
import { NotionModule } from '../notion/notion.module';
import { IncomeCategoriesController } from './income-categories.controller';

@Module({
  imports: [NotionModule],
  controllers: [IncomeCategoriesController],
})
export class IncomeCategoriesModule {}
