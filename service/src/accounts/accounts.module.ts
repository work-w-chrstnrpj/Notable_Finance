import { Module } from '@nestjs/common';
import { NotionModule } from '../notion/notion.module';
import { AccountsController } from './accounts.controller';

@Module({
  imports: [NotionModule],
  controllers: [AccountsController],
})
export class AccountsModule {}
