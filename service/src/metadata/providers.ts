import { Provider } from '@nestjs/common';
import { InMemoryMetadataRepository } from './repositories/in-memory.repository';

export const METADATA_REPOSITORY = 'METADATA_REPOSITORY';

export const metadataRepositoryProvider: Provider = {
  provide: METADATA_REPOSITORY,
  useClass: InMemoryMetadataRepository, // Swap to PostgresMetadataRepository when DB is available
};
