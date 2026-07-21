import { Module } from '@nestjs/common';
import { NotionModule } from '../notion/notion.module';
import {
  AlkansyaController,
  CreditCardPaymentsController,
  ReceivablesController,
  TransactionsController,
  TransfersController,
} from './transactions.controller';

@Module({
  imports: [NotionModule],
  controllers: [
    TransactionsController,
    TransfersController,
    CreditCardPaymentsController,
    AlkansyaController,
    ReceivablesController,
  ],
})
export class TransactionsModule {}
