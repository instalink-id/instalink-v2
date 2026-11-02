import { Controller, Get } from '@nestjs/common';
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
  getReadiness() {
    return {
      status: 'ok',
      checks: {
        configuration: 'ok',
        database: 'not-configured',
        externalIntegrations: 'not-configured',
      },
    };
  }
}
