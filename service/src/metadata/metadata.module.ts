import { Module } from '@nestjs/common';
import { MetadataService } from './metadata.service';
import { metadataRepositoryProvider } from './providers';

@Module({
  providers: [MetadataService, metadataRepositoryProvider],
  exports: [MetadataService],
})
export class MetadataModule {}
