import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getStatus() {
    return { status: 'ok', version: '0.1.0' };
  }
}
