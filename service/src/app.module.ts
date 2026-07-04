import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { NotionModule } from './notion/notion.module';
import { MappingModule } from './mapping/mapping.module';
import { ValidationModule } from './validation/validation.module';
import { MetadataModule } from './metadata/metadata.module';
import { AccountsModule } from './accounts/accounts.module';
import { IncomeCategoriesModule } from './income-categories/income-categories.module';
import { IncomesModule } from './incomes/incomes.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ExpenseSchedulerModule } from './expense-scheduler/expense-scheduler.module';
import { MonthlyMonitoringModule } from './monthly-monitoring/monthly-monitoring.module';
import { SyncModule } from './sync/sync.module';
import { ConflictModule } from './conflict/conflict.module';
import { SchemaDriftModule } from './schema-drift/schema-drift.module';
import { LoggingModule } from './logging/logging.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AppConfigModule,
    AuthModule,
    NotionModule,
    MappingModule,
    ValidationModule,
    MetadataModule,
    AccountsModule,
    IncomeCategoriesModule,
    IncomesModule,
    TransactionsModule,
    ExpenseCategoriesModule,
    ExpensesModule,
    ExpenseSchedulerModule,
    MonthlyMonitoringModule,
    SyncModule,
    ConflictModule,
    SchemaDriftModule,
    LoggingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
