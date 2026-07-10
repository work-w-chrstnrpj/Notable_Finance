import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { NotionService } from '../notion/notion.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('system')
@UseGuards(OptionalJwtAuthGuard)
export class SchemaDriftController {
  constructor(private readonly notionService: NotionService) {}

  @Get('schema-status')
  getSchemaStatus(@CurrentUser() user?: JwtPayload) {
    return this.notionService.schemaStatus(user?.id);
  }
}
