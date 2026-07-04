import { Module } from '@nestjs/common';
import { NotionModule } from '../notion/notion.module';
import { IncomesController } from './incomes.controller';

@Module({
  imports: [NotionModule],
  controllers: [IncomesController],
})
export class IncomesModule {}
