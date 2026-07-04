import { Controller, Get } from '@nestjs/common';
import { NotionService } from '../notion/notion.service';

@Controller('system')
export class SchemaDriftController {
  constructor(private readonly notionService: NotionService) {}

  @Get('schema-status')
  getSchemaStatus() {
    return this.notionService.schemaStatus();
  }
}
