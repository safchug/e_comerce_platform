import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService, HealthStatus } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check service health/liveness' })
  @ApiOkResponse({ description: 'Service is healthy', type: HealthStatus })
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }
}
