import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class HealthStatus {
  @ApiProperty({ enum: ['ok'], example: 'ok' })
  status!: 'ok';

  @ApiProperty({
    description: 'Process uptime in seconds',
    example: 12345.67,
  })
  uptime!: number;

  @ApiProperty({
    description: 'ISO 8601 timestamp of the response',
    example: '2026-08-06T12:00:00.000Z',
  })
  timestamp!: string;
}

@Injectable()
export class AppService {
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
