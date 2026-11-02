import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('system')
@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'instalink-backend',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HttpCode(HttpStatus.SERVICE_UNAVAILABLE)
  getReadiness() {
    return {
      status: 'not_ready',
      checks: {
        configuration: 'ok',
        database: 'not-configured',
        externalIntegrations: 'not-configured',
      },
    };
  }
}
