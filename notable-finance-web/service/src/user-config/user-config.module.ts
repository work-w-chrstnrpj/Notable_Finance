import { Module } from '@nestjs/common';
import { UserConfigService } from './user-config.service';
import { UserConfigController } from './user-config.controller';

@Module({
  controllers: [UserConfigController],
  providers: [UserConfigService],
  exports: [UserConfigService],
})
export class UserConfigModule {}
