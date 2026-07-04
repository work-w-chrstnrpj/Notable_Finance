import { Injectable } from '@nestjs/common';

@Injectable()
export class ConflictService {
  detectStaleMutation(options: {
    loadedLastEditedAt?: string;
    currentLastEditedAt?: string;
  }) {
    return Boolean(
      options.loadedLastEditedAt &&
        options.currentLastEditedAt &&
        options.loadedLastEditedAt !== options.currentLastEditedAt,
    );
  }
}
