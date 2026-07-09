import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotionService } from '../notion/notion.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('system')
export class SchemaDriftController {
  constructor(private readonly notionService: NotionService) {}

  @Get('schema-status')
  getSchemaStatus(@CurrentUser() user?: JwtPayload) {
    return this.notionService.schemaStatus(user?.id);
  }
}
