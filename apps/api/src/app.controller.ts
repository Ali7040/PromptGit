import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): object {
    return { 
      message: 'PromptGit API is running',
      version: '0.1.0',
      docs: '/api/docs'
    };
  }
}

export {};