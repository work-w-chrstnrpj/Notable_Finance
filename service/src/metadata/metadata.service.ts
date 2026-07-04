import { Injectable } from '@nestjs/common';

@Injectable()
export class MetadataService {
  private readonly auditEvents: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
  }> = [];

  addAuditEvent(type: string, message: string) {
    const event = {
      id: `${Date.now()}-${this.auditEvents.length + 1}`,
      type,
      message,
      createdAt: new Date().toISOString(),
    };
    this.auditEvents.push(event);
    return event;
  }

  listAuditEvents() {
    return [...this.auditEvents];
  }
}
