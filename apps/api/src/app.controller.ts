import { Controller, Get } from '@nestjs/common';
import { XrplService } from './xrpl/xrpl.service';

@Controller()
export class AppController {
  constructor(private readonly xrplService: XrplService) {}

  @Get('health')
  health() {
    return {
      ok: true,
      service: 'hi-dorri-api',
      time: new Date().toISOString(),
    };
  }

  @Get('xrpl/status')
  async xrplStatus() {
    return this.xrplService.getServerInfo();
  }
}
