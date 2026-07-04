import { Module } from '@nestjs/common';
import { MappingModule } from '../mapping/mapping.module';
import { ValidationService } from './validation.service';

@Module({
  imports: [MappingModule],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
